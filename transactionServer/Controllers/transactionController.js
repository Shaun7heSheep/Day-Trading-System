const transactionModel = require("../Models/transactions");
const userModel = require("../Models/users");
const stockAccountModel = require("../Models/stockAccount");
const redisController = require("./redisController")
const transactionNumController = require("./transactNumController");
const logController = require("./logController");
const quoteController = require("./quoteController");
const cache = require("../Redis/redis_init")

// Add a new user
exports.addTransaction = async (request, response) => {
  const transaction = new transactionModel(request.body);
  try {
    await transaction.save();
    response.send(transaction);
  } catch (error) {
    response.status(500).send(error);
  }
};

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
  try {
    let userID = request.body.userID;
    let symbol = request.body.symbol;
    let amount = request.body.amount;
    let price = request.body.price;
    var userBalance = await redisController.getBalanceInCache(userID);
    if (userBalance == null) { // user not in Redis cache
      logController.logError('BUY', userID, numDoc, "User not found");
      throw "User not found"
    }
    if (userBalance >= amount) {

      let quoteData = await quoteController.getQuote(userID, symbol, numDoc);
      let quoteDataArr = quoteData.split(",");
      // buyTransaction.price = quoteDataArr[0];
      price = quoteDataArr[0];

      const buy_Key = `${request.body.userID}_buy`;
      const buyObj = { symbol: symbol, amount: amount, price: price };
      const jsonString = JSON.stringify(buyObj);
      cache.SETEX(buy_Key, 60, jsonString);

      // await buyTransaction.save();
      response.status(200).send(buyObj);
    } else {
      throw "User does not have enough money in the balance";
    }
  } catch (error) {
    logController.logError("BUY", request.body.userID, numDoc, error);
    response.status(500).send(error);
  }
};

exports.commitBuyStock = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum();
  // log user command
  logController.logUserCmnd("COMMIT_BUY", request, numDoc);
  try {
    const buy_Key = `${request.body.userID}_buy`;
    // get user from Redis cache
    var buyInCache = await cache.get(buy_Key);
    if (!buyInCache) {
      throw "There is no cache for BUY";
    }

    const buyObj = JSON.parse(buyInCache);

    let numOfShares = Math.floor(
      Number(buyObj.amount) / Number(buyObj.price)
    );
    const updatedStockAccount = await stockAccountModel.findOneAndUpdate(
      {
        userID: request.body.userID,
        symbol: buyObj.symbol,
      },
      { $inc: { quantity: numOfShares } },
      { new: true, upsert: true }
    );
    if (!updatedStockAccount) {
      throw `Cannot find stockAccount with userID: ${request.body.userID}`;
    }

    const updatedUser = await userModel.findOneAndUpdate(
      { userID: request.body.userID },
      { $inc: { balance: -buyObj.amount } },
      { returnDocument: "after" }
    );
    if (!updatedUser) {
      return response.status(404).send("Cannot find user");
    }
    const balance_Key = `${request.body.userID}_balance`;
    cache.set(balance_Key, updatedUser.balance);
    cache.expire(balance_Key, 600);

    transactionModel.create({
      userID: request.body.userID,
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

    response.status(200).send(updatedUser);

  } catch (error) {
    logController.logError(
      "COMMIT_BUY",
      request.body.userID,
      numDoc,
      error
    );
    response.status(500).send(error);
  }
};

exports.cancelBuyStock = async (request, response) => {
  var numDoc = await transactionNumController.getNextTransactNum();
  logController.logUserCmnd("CANCEL_BUY", request, numDoc);
  try {
    const buy_Key = `${request.body.userID}_buy`;
    // get user from Redis cache
    var buyInCache = await cache.get(buy_Key);
    if (!buyInCache) {
      throw "There is no cache for BUY";
    }
    const buyObj = JSON.parse(buyInCache);
    transactionModel.create({
      userID: request.body.userID,
      symbol: buyObj.symbol,
      action: "buy",
      price: buyObj.price,
      amount: buyObj.amount,
      status: "canceled"
    }).catch(err => {console.log(err)});
    
    cache.DEL(buy_Key);
    response.status(200).send(buyTransaction);
  } catch (error) {
    // get and update current transactionNum
    logController.logError("CANCEL_BUY",request.body.userID,numDoc,error);
    response.status(500).send(error);
  }
};

exports.buyStockForSet = async (userId, symbol, amountReserved, currentStockPrice) => {
  let numOfShares = Math.floor(
    Number(amountReserved) / Number(currentStockPrice)
  );
  console.log(`Number of shares we will buy: ${numOfShares}`);
  const updatedStockAccount = await stockAccountModel.findOneAndUpdate(
    {
      userID: userId,
      symbol: symbol,
    },
    { $inc: { quantity: numOfShares } },
    { new: true, upsert: true }
  );
  if (!updatedStockAccount) {
    throw `Cannot find stockAccount with userID: ${userId}`;
  }

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
  console.log(`Money added to our balance: ${amount}`);
  const updatedUser = await userModel.findOneAndUpdate(
    {
      _id: userId,
    },
    { $inc: { balance: amount } },
    { new: true, upsert: true }
  );
  if (!updatedUser) {
    throw `Cannot find user: ${userId}`;
  }

  transactionModel.create({
    userID: userId,
    symbol: symbol,
    action: "sell",
    price: currentStockPrice,
    amount: numberOfSharesReserved,
    status: "commited"
  }).catch(err => {console.log(err);});

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

  try {
    var stockOwned = await stockAccountModel.findOne({ userID: userID, symbol: symbol })
    if (stockOwned) {
      if (stockOwned.quantity < numOfShares) {
        throw "User do not have enough shares";
      } else {
        // let quoteData = await quoteController.getQuote(
        //   userID,
        //   symbol,
        //   numDoc
        // );
        // let quoteDataArr = quoteData.split(",");
        // price = quoteDataArr[0];
        const sell_Key = `${request.body.userID}_sell`;
        const sellObj = { symbol: symbol, amount: numOfShares, price: price };
        const jsonString = JSON.stringify(sellObj);
        cache.SETEX(sell_Key, 60, jsonString);
        response.status(200).send(sellObj);
      }
    } else {
      throw "User do not own the stock symbol";
    }
  } catch (error) {
    logController.logError("SELL", request.body.userID, numDoc, error);
    response.status(500).send(error);
  }
};


exports.commitSellStock = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum();
  // log user command
  logController.logUserCmnd("COMMIT_SELL", request, numDoc);

  try {
    const sell_Key = `${request.body.userID}_sell`;
    // get user from Redis cache
    var sellInCache = await cache.get(sell_Key);
    if (!sellInCache) {
      throw "There is no cache for SELL";
    }

    const sellObj = JSON.parse(sellInCache);

    let numOfShares = sellObj.amount;

    await stockAccountModel.updateOne(
      {
        userID: request.body.userID,
        symbol: sellObj.symbol,
      },
      { $inc: { quantity: -numOfShares } }
    );

    const updatedUser = await userModel.findOneAndUpdate(
      { userID: request.body.userID },
      { $inc: { balance: numOfShares * sellObj.price } },
      { returnDocument: "after" }
    );
    if (!updatedUser) {
      return response.status(404).send("Cannot find user");
    }
    const balance_Key = `${request.body.userID}_balance`;
    cache.set(balance_Key, updatedUser.balance);
    cache.expire(balance_Key, 600);

    request.body.amount = numOfShares * sellObj.price;
    logController.logSystemEvent("COMMIT_SELL", request, numDoc);
    logController.logTransactions("add", request, numDoc);

    transactionModel.create({
      userID: request.body.userID,
      symbol: sellObj.symbol,
      action: "sell",
      price: sellObj.price,
      amount: sellObj.amount,
      status: "committed"
    }).catch(err => {console.log(err);});
    cache.DEL(sell_Key);
    response.status(200).send(updatedUser);

  } catch (error) {
    logController.logError("COMMIT_SELL",request.body.userID,numDoc,error);
    response.status(500).send(error);
  }
};

exports.cancelSellStock = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum();
  // log user command
  logController.logUserCmnd("CANCEL_SELL", request, numDoc);
  try {
    const sell_Key = `${request.body.userID}_sell`;
    // get user from Redis cache
    var sellInCache = await cache.get(sell_Key);
    if (!sellInCache) {
      throw "There is no cache for SELL";
    }
    const sellObj = JSON.parse(sellInCache);

    transactionModel.create({
      userID: request.body.userID,
      symbol: sellObj.symbol,
      action: "sell",
      price: sellObj.price,
      amount: sellObj.amount,
      status: "canceled"
    }).catch(err => {console.log(err);});
    cache.DEL(sell_Key);

    response.status(200).send(sellTransaction);
    
  } catch (error) {
    logController.logError(
      "CANCEL_SELL",
      request.body.userID,
      numDoc,
      error
    );
    response.status(500).send(error);
  }
};

exports.getTransactionSummary = async (request, response) => {
  var numDoc = await transactionNumController.getNextTransactNum();
  logController.logUserCmnd("DISPLAY_SUMMARY", request, numDoc);
  try {
    response.status(200).send("Transaction Summary");
  } catch (error) {
    response.status(500).send(error);
  }
};