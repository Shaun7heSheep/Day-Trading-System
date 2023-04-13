const transactionModel = require("../Models/transactions");
const userModel = require("../Models/users");
const stockAccountModel = require("../Models/stockAccount");
const redisController = require("./redisController")
const transactionNumController = require("./transactNumController");
const logController = require("./logController");
const quoteController = require("./quoteController");
const cache = require("../Redis/redis_init")


// Get all transactions
exports.getAllTransactions = async (request, response) => {
  const transactions = await transactionModel.find({});
  try {
    response.send(transactions);
  } catch (error) {
    response.status(500).send(error);
  }
};

exports.buyStock = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum();
  // log user command
  logController.logUserCmnd("BUY", request, numDoc);
  let userID = request.body.userID;
  let symbol = request.body.symbol;
  let amount = Number(request.body.amount);
  let price = request.body.price;
  try {
    var userBalance = await redisController.getBalanceInCache(userID);

    if (userBalance == null) { throw "User not found" };

    if (userBalance >= amount) {

      let quoteData = await quoteController.getQuote(userID, symbol, numDoc);
      let quoteDataArr = quoteData.split(",");
      price = quoteDataArr[0];

      const buy_Key = `${userID}_buy`;
      const buyObj = { symbol: symbol, amount: amount, price: price };
      const jsonString = JSON.stringify(buyObj);
      cache.set(buy_Key, jsonString, {EX: 60});

      return response.status(200).send(buyObj);
    } else {
      throw "User does not have enough money in the balance";
    }
  } catch (error) {
    logController.logError("BUY", userID, numDoc, error);
    return response.status(500).send(error);
  }
};

exports.commitBuyStock = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum();
  // log user command
  logController.logUserCmnd("COMMIT_BUY", request, numDoc);

  const userId = request.body.userID;
  try {
    const buy_Key = `${userId}_buy`;
    // get user from Redis cache
    var buyInCache = await cache.get(buy_Key);
    if (!buyInCache) { throw "No previous BUY command";}

    const buyObj = JSON.parse(buyInCache);

    if (buyObj.amount < buyObj.price) { throw 'Stock price higher than Buy amount';}

    let numOfShares = Math.floor(
      Number(buyObj.amount) / Number(buyObj.price)
    );

    stockAccountModel.findOneAndUpdate(
      {
        userID: userId,
        symbol: buyObj.symbol,
      },
      { $inc: { quantity: numOfShares } },
      { new: true, upsert: true }
    ).catch((err) => {console.log(err);})

    userModel.findOneAndUpdate(
      { _id: userId },
      { $inc: { balance: -buyObj.amount } },
      { returnDocument: "after" }
    ).catch((err) => {console.log(err);})

    const balance_Key = `${userId}:balance`;
    const updatedBalance = Number(await cache.incrByFloat(balance_Key, -buyObj.amount));
    cache.expire(balance_Key, 600);

    transactionModel.create({
      userID: userId,
      symbol: buyObj.symbol,
      action: "buy",
      price: buyObj.price,
      amount: buyObj.amount,
      status: "commited"
    }).catch(err => {console.log(err)});

    request.body.amount = buyObj.amount;
    logController.logSystemEvent("COMMIT_BUY", request, numDoc);
    logController.logTransactions("remove", request, numDoc);

    cache.DEL(buy_Key);
    const updatedData = {
      numOfShares: numOfShares,
      balance: updatedBalance
    }
    return response.status(200).send(updatedData);

  } catch (error) {
    logController.logError("COMMIT_BUY", userId, numDoc, error);
    return response.status(500).send(error);
  }
};

exports.cancelBuyStock = async (request, response) => {
  var numDoc = await transactionNumController.getNextTransactNum();
  logController.logUserCmnd("CANCEL_BUY", request, numDoc);

  const userId = request.body.userID;
  try {
    const buy_Key = `${userId}_buy`;
    // get user from Redis cache
    var buyInCache = await cache.get(buy_Key);
    if (!buyInCache) {
      throw "There is no cache for BUY";
    }
    const buyObj = JSON.parse(buyInCache);
    transactionModel.create({
      userID: userId,
      symbol: buyObj.symbol,
      action: "buy",
      price: buyObj.price,
      amount: buyObj.amount,
      status: "canceled"
    }).catch(err => {console.log(err)});
    
    cache.DEL(buy_Key);
    return response.status(200).send('Buy Canceled');
  } catch (error) {
    // get and update current transactionNum
    logController.logError("CANCEL_BUY", userId, numDoc, error);
    return response.status(500).send(error);
  }
};

exports.buyStockForSet = async (userId, symbol, amountReserved, currentStockPrice) => {
  let numOfShares = Math.floor(
    Number(amountReserved) / Number(currentStockPrice)
  );
  let leftOver = Number(amountReserved) - Number(currentStockPrice) *  numOfShares;

  cache.incrByFloat(`${userId}:balance`, leftOver);

  // return left over money back to balance
  userModel.findByIdAndUpdate(
    userId,
    {$inc: {balance: leftOver}}
  ). catch(err => {console.log(err);})

  stockAccountModel.findOneAndUpdate(
    {
      userID: userId,
      symbol: symbol,
    },
    { $inc: { quantity: numOfShares } },
    { new: true, upsert: true }
  ).catch(err => {console.log(err)});

  transactionModel.create({
    userID: userId,
    symbol: symbol,
    action: "buy",
    price: currentStockPrice,
    amount: amountReserved,
    status: "commited"
  }).catch(err => {console.log(err)});
}

exports.sellStockForSet = async (userId, symbol, numberOfSharesReserved, currentStockPrice) => {
  let amount = Number(numberOfSharesReserved) * Number(currentStockPrice);
  const updatedUser = await userModel.findOneAndUpdate(
    { _id: userId},
    { $inc: { balance: amount } },
    { new: true }
  ).catch(err => {console.log(err);})

  transactionModel.create({
    userID: userId,
    symbol: symbol,
    action: "sell",
    price: currentStockPrice,
    amount: numberOfSharesReserved,
    status: "commited"
  }).catch(err => {console.log(err);});
  return updatedUser.balance;
}

exports.sellStock = async (request, response) => {
  let userID = request.body.userID;
  let symbol = request.body.symbol;
  let numOfShares = request.body.amount;
  let price = request.body.price;

  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum();
  // log user command
  logController.logUserCmnd("SELL", request, numDoc);

  // get user from Redis cache or update cache
  var userBalance = await redisController.getBalanceInCache(userID);
  if (userBalance == null) {
    logController.logError('SELL', userID, numDoc, "User not found");
    return response.status(404).send("User not found");
  }
  try {
    var stockOwned = await stockAccountModel.findOne({ userID: userID, symbol: symbol })
    if (stockOwned) {
      if (stockOwned.quantity < numOfShares) {
        throw "User do not have enough shares";
      } else {
        let quoteData = await quoteController.getQuote(userID,symbol,numDoc);
        let quoteDataArr = quoteData.split(",");
        price = quoteDataArr[0];
        const sell_Key = `${userID}_sell`;
        const sellObj = { symbol: symbol, amount: numOfShares, price: price };
        const jsonString = JSON.stringify(sellObj);
        cache.set(sell_Key, jsonString, {EX:60});
        return response.status(200).send(sellObj);
      }
    } else {
      throw "User do not own the stock symbol";
    }
  } catch (error) {
    logController.logError("SELL", userID, numDoc, error);
    return response.status(500).send(error);
  }
};


exports.commitSellStock = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum();
  // log user command
  logController.logUserCmnd("COMMIT_SELL", request, numDoc);

  const userId = request.body.userID;
  try {
    const sell_Key = `${userId}_sell`;
    // get user from Redis cache
    var sellInCache = await cache.get(sell_Key);
    if (!sellInCache) {
      throw "No previous SELL command";
    }

    const sellObj = JSON.parse(sellInCache);

    let numOfShares = sellObj.amount;
    let profit = numOfShares * sellObj.price;

    stockAccountModel.updateOne(
      { userID: userId, symbol: sellObj.symbol},
      { $inc: { quantity: -numOfShares } }
    ).catch(err => {console.log(err);})

    userModel.findOneAndUpdate(
      { _id: userId },
      { $inc: { balance: profit } }
    ).catch(err => {console.log(err);})

    const balance_Key = `${userId}:balance`;
    const updatedBalance = Number(await cache.incrByFloat(balance_Key, profit));
    cache.expire(balance_Key, 600);

    request.body.amount = profit;
    logController.logSystemEvent("COMMIT_SELL", request, numDoc);
    logController.logTransactions("add", request, numDoc);

    transactionModel.create({
      userID: userId,
      symbol: sellObj.symbol,
      action: "sell",
      price: sellObj.price,
      amount: sellObj.amount,
      status: "committed"
    }).catch(err => {console.log(err);});
    cache.DEL(sell_Key);
    const updatedData = {
      numOfShares: numOfShares,
      balance: updatedBalance
    }
    return response.status(200).send(updatedData);

  } catch (error) {
    logController.logError("COMMIT_SELL", userId, numDoc, error);
    return response.status(500).send(error);
  }
};

exports.cancelSellStock = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum();
  // log user command
  logController.logUserCmnd("CANCEL_SELL", request, numDoc);

  const userId = request.body.userID;
  try {
    const sell_Key = `${userId}_sell`;
    // get user from Redis cache
    var sellInCache = await cache.get(sell_Key);
    if (!sellInCache) {
      throw "There is no cache for SELL";
    }
    const sellObj = JSON.parse(sellInCache);

    transactionModel.create({
      userID: userId,
      symbol: sellObj.symbol,
      action: "sell",
      price: sellObj.price,
      amount: sellObj.amount,
      status: "canceled"
    }).catch(err => {console.log(err);});
    cache.DEL(sell_Key);

    return response.status(200).send('SELL Canceled');
    
  } catch (error) {
    logController.logError("CANCEL_SELL", userId, numDoc, error);
    return response.status(500).send(error);
  }
};

exports.getTransactionSummary = async (request, response) => {
  var numDoc = await transactionNumController.getNextTransactNum();
  logController.logUserCmnd("DISPLAY_SUMMARY", request, numDoc);
  var userID = request.body.userID;
  try {
    const transactions = await transactionModel.find({userID: userID});
    response.status(200).send(transactions);
  } catch (error) {
    response.status(500).send(error);
  }
};