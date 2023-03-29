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

    var userBalance = await redisController.getBalanceInCache(userID);
    if (userBalance == null) { // user not in Redis cache
        logController.logError('BUY', userID, numDoc, "User not found");
        throw "User not found"
    }

    if (userBalance >= amount) {
      const buyTransaction = new transactionModel(request.body);
      buyTransaction.action = "buy";

      // let quoteData = await quoteController.getQuote(userID, symbol, numDoc);
      // let quoteDataArr = quoteData.split(",");
      // buyTransaction.price = quoteDataArr[0];

      await buyTransaction.save();
      response.status(200).send(buyTransaction);
    } else {
      throw "User does not have enough money in the balance";
    }
  } catch (error) {
    logController.logError("BUY", request.body.userID, numDoc, error);
    response.status(500).send(error);
  }
};

// exports.buyStockForSet = async (userID, symbol, amount, triggerPrice) => {
//   try {
//     const user = await userModel.findOne({ userID: userID });
//     if (!user) {
//       throw "User does not exist";
//     }
//     const buyTransaction = new transactionModel();
//     buyTransaction.userID = userID;
//     buyTransaction.symbol = symbol;
//     buyTransaction.amount = amount;
//     buyTransaction.action = "buy";
//     buyTransaction.price = triggerPrice;
//     await buyTransaction.save();
//   } catch (error) {
//     console.log(error);
//   }
// };

exports.commitBuyStock = async (request, response) => {
  const currentTime = Math.floor(new Date().getTime() / 1000);
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum();
  // log user command
  logController.logUserCmnd("COMMIT_BUY", request, numDoc);
  try {
    const latestTransaction = await transactionModel.findOne(
      { userID: request.body.userID, status: "init", action: "buy" },
      {},
      { sort: { createdAt: -1 } }
    );
    if (!latestTransaction) {
      throw "Transaction does not exist";
    }
    if (latestTransaction.amount < latestTransaction.price){
      throw "Insufficent amount to buy stock"
    }
    const transactionTime = Math.floor(
      new Date(latestTransaction.createdAt).getTime() / 1000
    );
    if (currentTime - transactionTime <= 60) {
      latestTransaction.status = "commited";
      let numOfShares = Math.floor(
        latestTransaction.amount / latestTransaction.price
      );

      const updatedStockAccount = await stockAccountModel.findOneAndUpdate(
        { 
          userID: request.body.userID,
          symbol: latestTransaction.symbol,
        },
        { $inc: { quantity: numOfShares } },
        { new: true, upsert: true }
      );
      if (!updatedStockAccount) {
        throw `Cannot find stockAccount with userID: ${request.body.userID}`;
      } 

      const updatedUser = await userModel.findOneAndUpdate(
        { userID: request.body.userID },
        { $inc: { balance: -latestTransaction.amount } },
        { returnDocument: "after" }
      );
      if (!updatedUser) {
        return response.status(404).send("Cannot find user");
      }
      const balance_Key = `${request.body.userID}_balance`;
      cache.set(balance_Key, updatedUser.balance);
      cache.expire(balance_Key, 600);

      request.body.amount = latestTransaction.amount;
      logController.logSystemEvent("COMMIT_BUY", request, numDoc);
      logController.logTransactions("remove", request, numDoc);

      await latestTransaction.save();
      response.status(200).send(updatedUser);
    } else {
      response.status(400).send("Buy request is expired or not initialized");
    }
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

// exports.commitBuyForSet = async (userID, stockPrice) => {
//   // get and update current transactionNum
//   //var numDoc = await transactionNumController.getNextTransactNum();
//   // log user command
//   //logController.logUserCmnd("COMMIT_BUY", request, numDoc);
//   try {
//     const latestTransaction = await transactionModel.findOneAndUpdate(
//       { userID: userID, status: "init", action: "buy" },
//       {},
//       { sort: { createdAt: -1 } }
//     );
//     if (!latestTransaction) {
//       throw "Transaction does not exist";
//     }
//     latestTransaction.status = "commited";
//     //logController.logSystemEvent("COMMIT_BUY", request, numDoc);
//     let numOfShares = Math.floor(latestTransaction.amount / stockPrice);
//     let hasStock = await userModel.countDocuments({
//       userID: userID,
//       "stocksOwned.symbol": latestTransaction.symbol,
//     });
//     if (hasStock > 0) {
//       await userModel.updateOne(
//         { userID: userID, "stocksOwned.symbol": latestTransaction.symbol },
//         { $inc: { "stocksOwned.$.quantity": numOfShares } }
//       );
//     } else {
//       await userModel.updateOne(
//         { userID: userID },
//         {
//           $push: {
//             stocksOwned: {
//               symbol: latestTransaction.symbol,
//               quantity: numOfShares,
//             },
//           },
//         }
//       );
//     }

//     await latestTransaction.save();
//   } catch (error) {
//     console.log(error);
//   }
// };

exports.cancelBuyStock = async (request, response) => {
  const currentTime = Math.floor(new Date().getTime() / 1000);
  var numDoc = await transactionNumController.getNextTransactNum();
  logController.logUserCmnd("CANCEL_BUY", request, numDoc);
  try {
    const latestTransaction = await transactionModel.findOneAndUpdate(
      { userID: request.body.userID, status: "init", action: "buy" },
      {},
      { sort: { createdAt: -1 } }
    );
    if (!latestTransaction) {
      throw "Transaction does not exist";
    }
    const transactionTime = Math.floor(
      new Date(latestTransaction.createdAt).getTime() / 1000
    );
    if (currentTime - transactionTime <= 60) {
      latestTransaction.status = "cancelled";
      await latestTransaction.save();
      response.status(200).send(latestTransaction);
    } else {
      response.status(400).send("Buy request is expired or not initialized");
    }
  } catch (error) {
    // get and update current transactionNum
    logController.logError(
      "CANCEL_BUY",
      request.body.userID,
      numDoc,
      error
    );
    response.status(500).send(error);
  }
};

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
    // const user = await userModel.findOne({ userID: userID });
    // if (!user) {
    //   throw "userID not found";
    // }

    var stockOwned = stockAccountModel.findOne({ userID: userID, symbol: symbol })
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

        var sellTransaction = await transactionModel.create({
          userID: userID,
          symbol: symbol,
          action: "sell",
          price: price,
          amount: request.body.amount,
        });
        response.status(200).send(sellTransaction);
      }
    } else {
      throw "User do not own the stock symbol";
    }
  } catch (error) {
    logController.logError("SELL", request.body.userID, numDoc, error);
    response.status(500).send(error);
  }
};

// exports.sellStockForSet = async (userID, symbol, numOfShares, triggerPrice) => {
//   try {
//     const user = await userModel.findOne({ userID: userID });
//     if (!user) {
//       throw "Invalid User";
//     }
//     var stockOwned = user.stocksOwned.find(
//       (element) => element.symbol == symbol
//     );
//     if (stockOwned) {
//       if (stockOwned.quantity < numOfShares) {
//         throw "User do not have enough shares";
//       } else {

//         var sellTransaction = await transactionModel.create({
//           userID: userID,
//           symbol: symbol,
//           action: "sell",
//           price: triggerPrice,
//           amount: numOfShares,
//         });
//       }
//     } else {
//       throw "User do not own the stock symbol";
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

exports.commitSellStock = async (request, response) => {
  const currentTime = Math.floor(new Date().getTime() / 1000);

  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum();
  // log user command
  logController.logUserCmnd("COMMIT_SELL", request, numDoc);

  try {
    const latestTransaction = await transactionModel.findOneAndUpdate(
      { userID: request.body.userID, status: "init", action: "sell" },
      {},
      { sort: { createdAt: -1 } }
    );
    if (!latestTransaction) {
      throw "Transaction does not exist";
    }
    const transactionTime = Math.floor(
      new Date(latestTransaction.createdAt).getTime() / 1000
    );

    if (currentTime - transactionTime <= 60) {
      let numOfShares = latestTransaction.amount;

      await stockAccountModel.updateOne(
        {
          userID: request.body.userID,
          symbol: latestTransaction.symbol,
        },
        { $inc: { quantity: -numOfShares } }
      );

      const updatedUser = await userModel.findOneAndUpdate(
        { userID: request.body.userID },
        { $inc: { balance: numOfShares * latestTransaction.price } },
        { returnDocument: "after" }
      );
      if (!updatedUser) {
        return response.status(404).send("Cannot find user");
      }
      const balance_Key = `${request.body.userID}_balance`;
      cache.set(balance_Key, updatedUser.balance);
      cache.expire(balance_Key, 600);

      request.body.amount = numOfShares * latestTransaction.price;
      logController.logSystemEvent("COMMIT_SELL", request, numDoc);
      logController.logTransactions("add", request, numDoc);
      
      latestTransaction.status = "commited";
      await latestTransaction.save();
      response.status(200).send(updatedUser);
    } else {
      throw "Buy request is expired or not initialized";
    }
  } catch (error) {
    logController.logError(
      "COMMIT_SELL",
      request.body.userID,
      numDoc,
      error
    );
    response.status(500).send(error);
  }
};

// exports.commitSellStockForSet = async (userID, numDoc) => {
//   const currentTime = Math.floor(new Date().getTime() / 1000);
//   // get and update current transactionNum
//   //var numDoc = await transactionNumController.getNextTransactNum();
//   // log user command
//   //logController.logUserCmnd("COMMIT_SELL", request, numDoc);
//   try {
//     const latestTransaction = await transactionModel.findOneAndUpdate(
//       { userID: userID, status: "init", action: "sell" },
//       {},
//       { sort: { createdAt: -1 } }
//     );
//     if (!latestTransaction) {
//       throw "Transaction does not exist";
//     }
//     const transactionTime = Math.floor(
//       new Date(latestTransaction.createdAt).getTime() / 1000
//     );
//     if (currentTime - transactionTime <= 60) {
//       latestTransaction.status = "commited";
//       let numOfShares = latestTransaction.amount;
//       let amount = numOfShares * latestTransaction.price;

//       await userModel.updateOne(
//         { userID: userID, "stocksOwned.symbol": latestTransaction.symbol },
//         { $inc: { "stocksOwned.$.quantity": -numOfShares } }
//       );

//       const updatedUser = await userModel.findOneAndUpdate(
//         { userID: userID },
//         { $inc: { balance: amount } },
//         { returnDocument: "after" }
//       );
//       if (!updatedUser) {
//         throw "Cannot find user";
//       }
//       //logController.logSystemEvent("COMMIT_SELL", request, numDoc);
//       logController.logTransactionsForSet("add", userID, amount, numDoc);

//       await latestTransaction.save();
//     } else {
//       throw "Buy request is expired or not initialized";
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

exports.cancelSellStock = async (request, response) => {
  const currentTime = Math.floor(new Date().getTime() / 1000);
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum();
  // log user command
  logController.logUserCmnd("CANCEL_SELL", request, numDoc);
  try {
    const latestTransaction = await transactionModel.findOneAndUpdate(
      { userID: request.body.userID, status: "init", action: "sell" },
      {},
      { sort: { createdAt: -1 } }
    );
    if (!latestTransaction) {
      logController.logUserCmnd("CANCEL_SELL", request, numDoc);
      throw "Transaction does not exist";
    }
    const transactionTime = Math.floor(
      new Date(latestTransaction.createdAt).getTime() / 1000
    );
    if (currentTime - transactionTime <= 60) {
      latestTransaction.status = "cancelled";
      await latestTransaction.save();
      response.status(200).send(latestTransaction);
    } else {
      throw "Sell request is expired or not initialized";
    }
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

// exports.cancelSellStockForSet = async (userID) => {
//   const currentTime = Math.floor(new Date().getTime() / 1000);
//   try {
//     const latestTransaction = await transactionModel.findOneAndUpdate(
//       { userID: userID, status: "init", action: "sell" },
//       {},
//       { sort: { createdAt: -1 } }
//     );
//     if (!latestTransaction) {
//       throw "Transaction does not exist";
//     }
//     const transactionTime = Math.floor(
//       new Date(latestTransaction.createdAt).getTime() / 1000
//     );
//     if (currentTime - transactionTime <= 60) {
//       latestTransaction.status = "cancelled";
//       await latestTransaction.save();
//     } else {
//       throw "Sell request is expired or not initialized";
//     }
//   } catch (error) {
//     throw error;
//   }
// };

// exports.getTransactionSummary = async (request, response) => {
//   var numDoc = await transactionNumController.getNextTransactNum();
//   logController.logUserCmnd("DISPLAY_SUMMARY", request, numDoc);
//   try {
//     response.status(200).send("Transaction Summary");
//   } catch (error) {
//     response.status(500).send(error);
//   }
// };

// exports.deleteTransactions = async (request, response) => {
//   await transactionModel.deleteMany({});
//   response.status(200).send("All transactions deleted");
// };
