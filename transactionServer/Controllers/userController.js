const userModel = require("../Models/users");
//const reserveAccountModel = require("../Models/reserveAccount");
const stockAccountModel = require("../Models/stockAccount");
const logController = require("./logController");
const transactionNumController = require("./transactNumController");
const transactionController = require("./transactionController");
const redisController = require("./redisController")
const cache = require("../Redis/redis_init");
const cacheSub = require("../Redis/redisSub_init");

const publisher = cacheSub.duplicate(); // duplicate redis client
publisher.connect();

// Add a new user
exports.addUser = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum();
  // log user command
  logController.logUserCmnd("ADD", request, numDoc);
  const amount = Number(request.body.amount);
  const userId = request.body.userID;
  try {
    // insert new if not exist, else increase balance
    var updatedBalance = 0;
    const balance_Key = `${userId}:balance`;
    const exist = await cache.exists(balance_Key);
    if(exist == 1) {
      updatedBalance = Number(await cache.incrByFloat(balance_Key, amount));
      cache.expire(balance_Key, 600);
      userModel.findOneAndUpdate(
        { _id: userId },
        { $inc: { balance: amount } },
        { upsert: true }
      ).catch(err => {console.log(err);})

    } else {
      const updatedUser = await userModel.findOneAndUpdate(
        { _id: userId },
        { $inc: { balance: amount } },
        { new: true, upsert: true }
      );
      updatedBalance = updatedUser.balance;
      cache.set(balance_Key, updatedBalance, {EX: 600});
    }

    // log accountTransaction
    // await logController.logTransactions("add", request, numDoc);
    response.status(200).send(updatedUser);
  } catch (error) {
    logController.logError('ADD', userId, numDoc, error);
    response.status(500).send(error);
  }
};

// Get all users
exports.getAllUsers = async (request, response) => {
  try {
    const users = await userModel.find({});
    // response.render("index", { data: users });
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
  const balance_Key = `${userId}:balance`;

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

  try {
    userModel.findByIdAndUpdate(userId, { $inc: { balance: -stockAmount } })
    .catch((err) => {
      console.log(err);
      throw 'Error updating user balance'
    })
    // update user balance cache and return
    userBalance = Number(await cache.incrByFloat(balance_Key, -stockAmount));
    cache.expire(balance_Key, 600);

    // log accountTransaction
    logController.logSystemEvent("SET_BUY_AMOUNT", request, numDoc);
    logController.logTransactions("remove", request, numDoc);

    response.status(200).send(JSON.stringify(userBalance));
  } catch (error) {
    console.log(error);
    response.status(500).send(error);
  }
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

  const setbuy_Key = `${userId}_${stockSymbol}_setbuy`;
  const setbuy_cache = await cache.get(setbuy_Key);
  const stockReserveAccount = JSON.parse(setbuy_cache);

  if (!stockReserveAccount) {
    const error = "User must have specified a SET_BUY_AMOUNT prior to running SET_BUY_TRIGGER";
    logController.logError('SET_BUY_TRIGGER', userId, numDoc, error);
    return response.status(400).send(error);
  }

  response.status(200).send(stockReserveAccount);

  // todo: now starts checking for the stock price continually
  // if stock price dropped below triggerPrice, run the BUY command to buy that stock
  const quote_cache = await cache.get(stockSymbol);
  if (quote_cache) {
    var arr = quote_cache.split(",");
    const stockPriceInCache = Number(arr[0]);
    if (stockPriceInCache <= triggerPrice) {
      transactionController.buyStockForSet(userId, stockSymbol, stockReserveAccount.amountReserved, stockPriceInCache);
      cache.del(setbuy_Key);
      return;
    }
  }
  //publisher.publish("subscriptions", `SUBSCRIBE ${userId} ${stockSymbol}`);
  var sub_key = `sub_${stockSymbol}`;
  cacheSub.incr(sub_key);

  const subscriber = cacheSub.duplicate();
  await subscriber.connect();
  subscriber.subscribe(stockSymbol, async (currentStockPrice) => {
    console.log(`${stockSymbol} price: ${currentStockPrice} - trigger: ${triggerPrice}`)
    if (Number(currentStockPrice) <= triggerPrice) {
      //publisher.publish("subscriptions", `CANCEL ${userId} ${stockSymbol}`);
      cacheSub.decr(sub_key);
      subscriber.unsubscribe(stockSymbol);
      subscriber.quit();
      transactionController.buyStockForSet(userId, stockSymbol, stockReserveAccount.amountReserved, currentStockPrice);
      console.log(`${stockSymbol} purchased for ${userId}`);
      cache.del(setbuy_Key);
    }
  })

  subscriber.subscribe(`${userId}:CANCELBUY:${stockSymbol}`, async (message) => {
    cacheSub.decr(sub_key);
    subscriber.unsubscribe(stockSymbol);
    subscriber.quit();
    cache.del(setbuy_Key);
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

  const setbuy_Key = `${userId}_${stockSymbol}_setbuy`;
  const setbuy_cache = await cache.get(setbuy_Key);
  const stockReserveAccount = JSON.parse(setbuy_cache);
  if (!stockReserveAccount) {
    const error = "No SET_BUY commands specified";
    logController.logError('CANCEL_SET_BUY', userId, numDoc, error);
    return response.status(400).send(error);
  } else {
    publisher.publish(`${userId}:CANCELBUY:${stockSymbol}`, `OK`);

    const updatedUser = await userModel.findByIdAndUpdate(userId, { $inc: { balance: Number(stockReserveAccount.amountReserved) } }, { new: true });
    const balance_Key = `${userId}_balance`;
    console.log(`user balance: ${updatedUser.balance}`);
    cache.SET(balance_Key, updatedUser.balance, { EX: 600 });
    cache.del(setbuy_Key);

      // log accountTransaction
      logController.logSystemEvent("CANCEL_SET_BUY", request, numDoc);
      logController.logTransactions("add", request, numDoc);
      response.status(200).send(updatedBalance);
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
  // get user from Redis cache or update cache
  var userBalance = await redisController.getBalanceInCache(userId);
  if (userBalance == null) {
    logController.logError('SET_BUY_AMOUNT', userId, numDoc, "User not found");
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

  return response.status(200).send(updatedStockAccount);
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

  const setsell_Key = `${userId}_${stockSymbol}_setsell`;
  const setsell_cache = await cache.get(setsell_Key);
  const stockReserveAccount = JSON.parse(setsell_cache);

  if (!stockReserveAccount) {
    const error = "No previous SET_SELL_AMOUNT command";
    logController.logError('SET_SELL_TRIGGER', userId, numDoc, error);
    return response.status(400).send(error);
  }
  response.status(200).send(stockReserveAccount);

  // todo: now starts checking for the stock price continually
  // if stock price exceeded or equals to triggerPrice, run the SELL command to sell that stock
  const quote_cache = await cache.get(stockSymbol);
  if (quote_cache) {
    var arr = quote_cache.split(",");
    const stockPriceInCache = Number(arr[0]);
    if (stockPriceInCache >= triggerPrice) {
      transactionController.sellStockForSet(userId, stockSymbol, stockReserveAccount.numberOfSharesReserved, stockPriceInCache);
      cache.del(setsell_Key);
      return;
    }
  }
  //publisher.publish("subscriptions", `SUBSCRIBE ${userId} ${stockSymbol}`);
  var sub_key = `sub_${stockSymbol}`;
  cacheSub.incr(sub_key);

  const subscriber = cache.duplicate();
  await subscriber.connect();
  subscriber.subscribe(stockSymbol, async (currentStockPrice) => {
    console.log(`${stockSymbol} price: ${currentStockPrice} - trigger: ${triggerPrice}`)
    if (Number(currentStockPrice) >= triggerPrice) {
      publisher.publish("subscriptions", `CANCEL ${userId} ${stockSymbol}`);

      transactionController.sellStockForSet(userId, stockSymbol, stockReserveAccount.numberOfSharesReserved, currentStockPrice);

      cache.del(setsell_Key);
      subscriber.unsubscribe(stockSymbol);
      subscriber.quit();
    }
  })

  subscriber.subscribe(`${userId}:CANCELSELL:${stockSymbol}`, async (message) => {
    cacheSub.decr(sub_key);
    subscriber.unsubscribe(stockSymbol);
    subscriber.quit();
    cache.del(setsell_Key);
  })
};

// CANCEL_SET_SELL
exports.cancelSetSell = async (request, response) => {
  var numDoc = await transactionNumController.getNextTransactNum()
  logController.logUserCmnd("CANCEL_SET_SELL", request, numDoc);
  const stockSymbol = request.body.symbol;
  const userId = request.body.userID;

  const setsell_Key = `${userId}_${stockSymbol}_setsell`;
  const setsell_cache = await cache.get(setsell_Key);
  const stockReserveAccount = JSON.parse(setsell_cache);

  if (!stockReserveAccount) {
    const error = "No SET_SELL commands specified";
    logController.logError('CANCEL_SET_SELL', userId, numDoc, error);
    response.status(400).send(error);
  } else {
    publisher.publish(`${userId}:CANCELSELL:${stockSymbol}`, `OK`);

    // return amount reserved
    const updatedStockAccount = await stockAccountModel.findOneAndUpdate(
      { userID: userId, symbol: stockSymbol }, 
      { $inc: { quantity: stockReserveAccount.numberOfSharesReserved } }, 
      { new: true }
    );

    // log accountTransaction
    logController.logSystemEvent("CANCEL_SET_SELL", request, numDoc);
    logController.logTransactions("add", request, numDoc);
    return response.status(200).send(updatedStockAccount);
  }
};

exports.deleteAllUsers = async (req, res) => {
  try {
    await userModel.deleteMany({});
  } catch (err) {
    console.error(`Delete users error: ${err}`)
  }
  res.status(200).send("All users deleted");
}