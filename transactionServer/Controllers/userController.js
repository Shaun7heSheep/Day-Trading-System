const userModel = require("../Models/users");
//const reserveAccountModel = require("../Models/reserveAccount");
const stockAccountModel = require("../Models/stockAccount");
const logController = require("./logController");
const transactionNumController = require("./transactNumController");
const transactionController = require("./transactionController");
const redisController = require("./redisController")
const cache = require("../Redis/redis_init")
const redis = require("redis");


const publisher = redis.createClient();
publisher.connect();

// Add a new user
exports.addUser = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum();
  // log user command
  logController.logUserCmnd("ADD", request, numDoc);
  try {
    // insert new if not exist, else increase balance
    const updatedUser = await userModel.findOneAndUpdate(
      { _id: request.body.userID },
      { $inc: { balance: Number(request.body.amount) } },
      { new: true, upsert: true }
    );
    const balance_Key = `${request.body.userID}_balance`;
    cache.set(balance_Key, updatedUser.balance);
    cache.expire(balance_Key, 600);

    // log accountTransaction
    // await logController.logTransactions("add", request, numDoc);
    response.status(200).send(updatedUser);
  } catch (error) {
    response.status(500).send(error);
  }
};

// Get all users
exports.getAllUsers = async (request, response) => {
  try {
    const users = await userModel.find({});
    response.status(200).send(users);
  } catch (error) {
    response.status(500).send(error);
  }
};

// // SET_BUY_AMOUNT
exports.setBuyAmount = async (request, response) => {
  // get and update current transactionNum
  const numDoc = await transactionNumController.getNextTransactNum();
  // log user command
  logController.logUserCmnd("SET_BUY_AMOUNT", request, numDoc);

  const stockSymbol = request.body.symbol;
  const stockAmount = Number(request.body.amount);
  const userId = request.body.userID;
  const balance_Key = `${userId}_balance`;

  // get user from Redis cache
  var userBalance = await redisController.getBalanceInCache(userId);

  if (userBalance == null) { // user not in Redis cache
    logController.logError('SET_BUY_AMOUNT', userId, numDoc, "User not found");
    return response.status(404).send("User not found");
  }

  if (userBalance < stockAmount) {
    logController.logError('SET_BUY_AMOUNT', userId, numDoc, "User not found");
    return response.status(400).send("Insufficient balance");
  }

  console.log(`first stockAmount: ${stockAmount}`);
  const setbuy_Key = `${userId}_${stockSymbol}_setbuy`;
  var setbuy_obj = await cache.get(setbuy_Key);
  if (setbuy_obj) {
    setbuy_obj = JSON.parse(setbuy_obj);
    setbuy_obj.amountReserved += stockAmount;
  } else {
    setbuy_obj = { userID: userId, symbol: stockSymbol, amountReserved: stockAmount };
  }
  const jsonString = JSON.stringify(setbuy_obj);
  cache.SET(setbuy_Key, jsonString);

  userModel.findByIdAndUpdate(userId, { $inc: { balance: -stockAmount } }, (err, doc) => {
    if (err) { console.log(err); }
  });

  // update user balance cache and return
  userBalance = await cache.DECRBY(balance_Key, stockAmount);

  // log accountTransaction
  logController.logSystemEvent("SET_BUY_AMOUNT", request, numDoc);
  logController.logTransactions("remove", request, numDoc);

  response.status(200).send(JSON.stringify(userBalance));
};

// SET_BUY_TRIGGER
exports.setBuyTrigger = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum()
  // log user command
  logController.logUserCmnd("SET_BUY_TRIGGER", request, numDoc);
  const stockSymbol = request.body.symbol;
  const triggerPrice = Number(request.body.amount);
  const userId = request.body.userID;
  const user = await userModel.findOne({ userID: userId });
  if (!user) {
    return response.status(404).send("User not found");
  }
  const setbuy_Key = `${userId}_${stockSymbol}_setbuy`;
  const setbuy_cache = await cache.get(setbuy_Key);
  const stockReserveAccount = JSON.parse(setbuy_cache);

  if (!stockReserveAccount) {
    const error = "User must have specified a SET_BUY_AMOUNT prior to running SET_BUY_TRIGGER";
    logController.logError('SET_BUY_TRIGGER', request.body.userID, numDoc, error);
    return response.status(400).send(error);
  }

  response.status(200).send(stockReserveAccount);

  // todo: now starts checking for the stock price continually
  // if stock price dropped below triggerPrice, run the BUY command to buy that stock
  const quote_cache = await cache.get(stockSymbol);
  if (quote_cache) {
    console.log("Current stock price found in cache");
    var arr = quote_cache.split(",");
    const stockPriceInCache = Number(arr[0]);
    console.log(`Quote response: ${quote_cache}`)
    if (stockPriceInCache <= triggerPrice) {
      console.log("Bought stock found in cache");
      await transactionController.buyStockForSet(userId, stockSymbol, stockReserveAccount.amountReserved, stockPriceInCache);
      cache.del(setbuy_Key);
      return;
    }
  }
  publisher.publish("subscriptions", `SUBSCRIBE ${userId} ${stockSymbol}`);

  const subscriber = redis.createClient();
  subscriber.connect();
  subscriber.subscribe(stockSymbol, async (currentStockPrice) => {
    console.log(`${stockSymbol} price: ${currentStockPrice} - trigger: ${triggerPrice}`)
    if (Number(currentStockPrice) <= triggerPrice) {
      publisher.publish("subscriptions", `CANCEL ${userId} ${stockSymbol}`);
      subscriber.unsubscribe(stockSymbol);
      subscriber.quit();
      await transactionController.buyStockForSet(userId, stockSymbol, stockReserveAccount.amountReserved, currentStockPrice);
      console.log(`${stockSymbol} purchased for ${userId}`);
      cache.del(setbuy_Key);
    }
  })
};

// CANCEL_SET_BUY
exports.cancelSetBuy = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum()
  // log user command
  logController.logUserCmnd("CANCEL_SET_BUY", request, numDoc);
  const stockSymbol = request.body.symbol;
  const userId = request.body.userID;
  const user = await userModel.findById(userId);
  if (!user) {
    return response.status(404).send("User not found");
  }

  const setbuy_Key = `${userId}_${stockSymbol}_setbuy`;
  const setbuy_cache = await cache.get(setbuy_Key);
  const stockReserveAccount = JSON.parse(setbuy_cache);
  if (!stockReserveAccount) {
    const error = "No SET_BUY commands specified";
    logController.logError('CANCEL_SET_BUY', request.body.userID, numDoc, error);
    return response.status(400).send(error);
  } else {
    publisher.publish("subscriptions", `CANCEL ${userId} ${stockSymbol}`);
    console.log("SET_BUY command cancelled");
    console.log(stockReserveAccount.amountReserved);

    const updatedUser = await userModel.findByIdAndUpdate(userId, { $inc: { balance: Number(stockReserveAccount.amountReserved) } }, { new: true });
    const balance_Key = `${userId}_balance`;
    console.log(`user balance: ${updatedUser.balance}`);
    cache.SET(balance_Key, updatedUser.balance, {EX: 600});
    cache.del(setbuy_Key);

    // log accountTransaction
    logController.logSystemEvent("CANCEL_SET_BUY", request, numDoc);
    logController.logTransactions("add", request, numDoc);
    response.status(200).send(updatedUser);
  }
};

// SET_SELL_AMOUNT
exports.setSellAmount = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum()
  // log user command
  logController.logUserCmnd("SET_SELL_AMOUNT", request, numDoc);
  const stockSymbol = request.body.symbol;
  const numberOfShares = Number(request.body.amount);
  const userId = request.body.userID;
  const user = await userModel.findById(userId);
  if (!user) {
    return response.status(404).send("User not found");
  }
  const stock = await stockAccountModel.findOne({ userID: userId, symbol: stockSymbol })
  if (!stock || stock.quantity < numberOfShares) {
    return response.status(400).send("Insufficient number of shares");
  }

  const setsell_Key = `${userId}_${stockSymbol}_setsell`;
  var setsell_obj = await cache.get(setsell_Key);
  if (setsell_obj) {
    setsell_obj = JSON.parse(setsell_obj);
    setsell_obj.numberOfSharesReserved += numberOfShares;
  } else {
    setsell_obj = { userID: userId, symbol: stockSymbol, numberOfSharesReserved: numberOfShares };
  }
  const jsonString = JSON.stringify(setsell_obj);
  cache.SET(setsell_Key, jsonString);

  const updatedStockAccount = await stockAccountModel.findOneAndUpdate({ userID: userId, symbol: stockSymbol }, { $inc: { quantity: -numberOfShares } }, { new: true })

  // log accountTransaction
  logController.logSystemEvent("SET_SELL_AMOUNT", request, numDoc);
  logController.logTransactions("remove", request, numDoc);

  response.status(200).send(updatedStockAccount);
};

// SET_SELL_TRIGGER
exports.setSellTrigger = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum()
  // log user command
  logController.logUserCmnd("SET_SELL_TRIGGER", request, numDoc);
  const stockSymbol = request.body.symbol;
  const triggerPrice = Number(request.body.amount);
  const userId = request.body.userID;
  const user = await userModel.findOne({ userID: userId });
  if (!user) {
    return response.status(404).send("User not found");
  }

  const setsell_Key = `${userId}_${stockSymbol}_setsell`;
  const setsell_cache = await cache.get(setsell_Key);
  const stockReserveAccount = JSON.parse(setsell_cache);

  if (!stockReserveAccount) {
    const error = "User must have specified a SET_SELL_AMOUNT prior to running SET_SELL_TRIGGER";
    logController.logError('SET_SELL_TRIGGER', request.body.userID, numDoc, error);
    return response.status(400).send(error);
  }
  response.status(200).send(stockReserveAccount);

  // todo: now starts checking for the stock price continually
  // if stock price exceeded or equals to triggerPrice, run the SELL command to sell that stock
  const quote_cache = await cache.get(stockSymbol);
  if (quote_cache) {
    console.log("Current stock price found in cache");
    var arr = quote_cache.split(",");
    const stockPriceInCache = Number(arr[0]);
    console.log(`Quote response: ${quote_cache}`)
    if (stockPriceInCache >= triggerPrice) {
      console.log("Sold stock found in cache");
      await transactionController.sellStockForSet(userId, stockSymbol, stockReserveAccount.numberOfSharesReserved, stockPriceInCache);
      cache.del(setsell_Key);
      return;
    }
  }
  publisher.publish("subscriptions", `SUBSCRIBE ${userId} ${stockSymbol}`);
  const subscriber = redis.createClient()
  subscriber.connect();
  await subscriber.subscribe(stockSymbol, async (currentStockPrice) => {
    console.log(`Current Price: ${currentStockPrice}, Trigger Price: ${triggerPrice}`);
    if (Number(currentStockPrice) >= triggerPrice) {
      publisher.publish("subscriptions", `CANCEL ${userId} ${stockSymbol}`);

      await transactionController.sellStockForSet(userId, stockSymbol, stockReserveAccount.numberOfSharesReserved, currentStockPrice);
      console.log(`${stockSymbol} sold at ${userId}`);

      cache.del(setsell_Key);
      subscriber.unsubscribe(stockSymbol);
      subscriber.quit();
    }
  })
};

// CANCEL_SET_SELL
exports.cancelSetSell = async (request, response) => {
  var numDoc = await transactionNumController.getNextTransactNum()
  logController.logUserCmnd("CANCEL_SET_SELL", request, numDoc);
  const stockSymbol = request.body.symbol;
  const userId = request.body.userID;
  const user = await userModel.findOne({ userID: userId });
  if (!user) {
    return response.status(404).send("User not found");
  }

  const setsell_Key = `${userId}_${stockSymbol}_setsell`;
  const setsell_cache = await cache.get(setsell_Key);
  const stockReserveAccount = JSON.parse(setsell_cache);
  const filter = {
    userID: userId,
    symbol: stockSymbol
  }
  if (!stockReserveAccount) {
    const error = "No SET_SELL commands specified";
    logController.logError('CANCEL_SET_SELL', request.body.userID, numDoc, error);
    return response.status(400).send(error);
  } else {
    publisher.publish("subscriptions", `CANCEL ${userId} ${stockSymbol}`);
    console.log("SET_SELL command cancelled");
    console.log(stockReserveAccount);
    const updatedStockAccount = await stockAccountModel.findOneAndUpdate(filter, { $inc: { quantity: stockReserveAccount.numberOfSharesReserved } }, { new: true });
    cache.del(setsell_Key);

    // log accountTransaction
    logController.logSystemEvent("CANCEL_SET_SELL", request, numDoc);
    logController.logTransactions("add", request, numDoc);
    response.status(200).send(updatedStockAccount);
  }
};