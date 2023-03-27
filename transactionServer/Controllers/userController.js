const userModel = require("../Models/users");
const reserveAccountModel = require("../Models/reserveAccount");
const stockAccountModel = require("../Models/stockAccount");
const logController = require("./logController");
const transactionNumController = require("./transactNumController");
const transactionController = require("./transactionController");
const redisController = require("./redisController")
const { Worker } = require("worker_threads");
const cache = require("../Redis/redis_init")
const redis = require("redis");
const net = require("net");
const subscriber = redis.createClient()
subscriber.connect();

const netClient = net.createConnection({ port: 4000 }, () => {
  console.log("Connected to subscription server");
})

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

// Get a specific user by userId
// exports.getUserByUserId = async (request, response) => {
//   try {
//     const user = await userModel.findOne({ userID: request.params.userID });
//     if (!user) {
//       return response.status(404).send(user);
//     }
//     response.status(200).send(user);
//   } catch (error) {
//     response.status(500).send(error);
//   }
// };

// // Update a specific user by userId
// exports.updateUserByUserId = async (request, response) => {
//   try {
//     const updatedUser = await userModel.findOneAndUpdate(
//       { userID: request.body.userID },
//       request.body,
//       {
//         new: true,
//         runValidators: true,
//       }
//     );
//     if (!updatedUser) {
//       return response.status(404).send(updatedUser);
//     }
//     response.status(200).send(updatedUser);
//   } catch (error) {
//     response.status(500).send(error);
//   }
// };

// // A map to store the worker thread
// // key: `${stockSymbol},${userId}\n`
// // value: the worker thread
// const workerMap = new Map();
// const createWorker = (quoteCommand) => {
//   const worker = new Worker("./Controllers/worker.js");
//   workerMap.set(quoteCommand, worker);

//   return worker;
// }

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
   console.log(userBalance);

   if (userBalance == null) { // user not in Redis cache
    // // get user from DB
    // const user = await userModel.findById(userId);
    // if (!user) {
      logController.logError('SET_BUY_TRIGGER', userId, numDoc, "User not found");
      return response.status(404).send("User not found");
    // } else {
    //   // update cache
    //   userBalance = user.balance;
    //   cache.set(balance_Key,userBalance);
    // }
   }

   if (userBalance < stockAmount) {
    logController.logError('SET_BUY_TRIGGER', userId, numDoc, "User not found");
    return response.status(400).send("Insufficient balance");
   }

   console.log(`first stockAmount: ${stockAmount}`);

   reserveAccountModel.findOneAndUpdate(
    {userID: userId, symbol: stockSymbol, action: 'buy'},
    {$inc: {amountReserved: stockAmount}},
    {upsert: true, new: true},
    function (err, doc) {
      if(err) { console.log(err); }
    }
   );
   
   userModel.findByIdAndUpdate(userId, {$inc: {balance: -stockAmount}}, function (err, doc) {
    if (err) {console.log(err);}
   });

   // update user balance cache and return
   userBalance = await cache.decrBy(balance_Key, stockAmount);
   // log accountTransaction
   logController.logSystemEvent("SET_BUY_AMOUNT",request,numDoc);
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
  const stockReserveAccount = await reserveAccountModel.findOne({ userID: userId, action: "buy", symbol: stockSymbol })
  if (!stockReserveAccount) {
    const error = "User must have specified a SET_BUY_AMOUNT prior to running SET_BUY_TRIGGER";
    logController.logError('SET_BUY_TRIGGER', request.body.userID, numDoc, error);
    return response
      .status(400)
      .send(
        error
      );
  }

  const filter = {
    userID: userId,
    symbol: stockSymbol,
    action: "buy",
  }
  let update = {$set: {"status": true, "triggerPrice": triggerPrice}};
  const options = { upsert: true, new: true }
  const updatedStockAccount = await reserveAccountModel.findOneAndUpdate(filter, update, options);
  response.status(200).send(updatedStockAccount);

  // todo: now starts checking for the stock price continually
  // if stock price dropped below triggerPrice, run the BUY command to buy that stock

  // const quoteCommand = `${stockSymbol},${userId}\n`;
  const quoteCommand = `${stockSymbol},${userId}\n`;
  netClient.write(`SUBSCRIBE ${userId} ${stockSymbol}`)
  await subscriber.subscribe(stockSymbol, async (currentStockPrice) => {
    console.log(`Current ${stockSymbol} price: ${currentStockPrice}`)
    if (Number(currentStockPrice) <= triggerPrice) {
      netClient.write(`CANCEL ${userId} ${stockSymbol}`)
      console.log(`stockReserveAccpunt ${stockReserveAccount}`);
      console.log(`stockReserveAccpunt.amountReserved: ${stockReserveAccount.amountReserved}`);
      // console.log(`stockReserveAccpunt.amountReserved: ${stockReserveAccount.amountReserved}`);
      await transactionController.buyStockForSet(userId, stockSymbol, stockReserveAccount.amountReserved, triggerPrice);
      await transactionController.commitBuyForSet(userId, currentStockPrice);
      console.log(`${stockSymbol} purchased for ${userId}`);
      
      // reserveAccountModel.findByIdAndDelete(updatedUser._id, );
      reserveAccountModel.findByIdAndDelete(stockReserveAccount._id, {}, (err, doc) => {
        if (err) {
          console.error(err);
        }
      });
    }
  })

  // const worker = createWorker(quoteCommand);

  // // Send the quote server command to the worker thread
  // worker.postMessage(quoteCommand);
  // // Listening to the worker thread for any response from quote server
  // worker.on("message", async (stockPrice) => {
  //   console.log("Current price for stock: " + stockPrice + " Trgger price: " + triggerPrice);
  //   if (Number(stockPrice) <= triggerPrice) {
  //     worker.terminate();
  //     workerMap.delete(quoteCommand);
  //     // Todo: buy stock
  //     await transactionController.buyStockForSet(userId, stockSymbol, stockReserveAccount.amountReserved, triggerPrice);
  //     await transactionController.commitBuyForSet(userId, stockPrice);
  //     //
  //     console.log("Stock purchased")
  //     update = {$set: {"reserveAccount.$[elem].status": "completed"}};
  //     await userModel.findOneAndUpdate(filter, update, options);
  //   }
  // })
};

// CANCEL_SET_BUY
exports.cancelSetBuy = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum()
  // log user command
  logController.logUserCmnd("CANCEL_SET_BUY", request, numDoc);
  const stockSymbol = request.body.symbol;
  const userId = request.body.userID;
  const user = await userModel.findById( userId );
  if (!user) {
    return response.status(404).send("User not found");
  }

  const stockReserveAccount = await reserveAccountModel.findOne({ userID: userId, action: "buy", symbol: stockSymbol })
  if (!stockReserveAccount) {
    const error = "No SET_BUY commands specified";
    logController.logError('CANCEL_SET_BUY', request.body.userID, numDoc, error);
    return response.status(400).send(error);
  } else {
    // const worker = workerMap.get(`${stockSymbol},${userId}\n`);
    // if (worker) {
    //   worker.terminate();
    //   workerMap.delete(`${stockSymbol},${userId}\n`);
    //   console.log("SET_BUY command cancelled");
    // }
    netClient.write(`CANCEL ${userId} ${stockSymbol}`)
    console.log("SET_BUY command cancelled");
    console.log(stockReserveAccount);
    const updatedUser = await userModel.findByIdAndUpdate(userId, { $inc: { balance: stockReserveAccount.amountReserved }}, {new: true});
    reserveAccountModel.findByIdAndDelete(stockReserveAccount._id, {}, (err, doc) => {
      if (err) {
        console.error(err);
      }
    });
    
    // log accountTransaction
    logController.logSystemEvent("CANCEL_SET_BUY",request,numDoc);
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
  const user = await userModel.findById( userId );
  if (!user) {
    return response.status(404).send("User not found");
  }
  const stock = await stockAccountModel.findOne({ userID: userId, symbol: stockSymbol })
  console.log(`this is stock: ${stock}`);
  // const stock = user.stocksOwned.find(stock => stock.symbol === stockSymbol);
  if (!stock || stock.quantity < numberOfShares) {
    return response.status(400).send("Insufficient number of shares");
  }

  const filter = {
    userID: userId,
    symbol: stockSymbol
  }
  // const stockReserveAccount = stockReserveAccount.findOne(action"sell" && account.symbol === stockSymbol && account.status !== "cancelled" && account.status !== "completed")
  // if (!stockReserveAccount) {
  //   await userModel.findOneAndUpdate(
  //     filter,
  //     { $push: { reserveAccount: { action: 'sell', symbol: stockSymbol, amountReserved: numberOfShares, status: "init" } } },
  //     { new: true }
  //   );
  // } else {
  //   let update = {$inc: {"reserveAccount.$[elem].amountReserved": numberOfShares }};
  //   const options = {arrayFilters: [{ "elem.action": "sell", "elem.symbol": stockSymbol, "elem.status": {$nin: ["cancelled", "completed"]} }], new: true}
  //   await userModel.findOneAndUpdate(filter, update, options);
  // }
  await reserveAccountModel.findOneAndUpdate(
    {userID: userId, symbol: stockSymbol, action: 'sell'},
    {$inc: {amountReserved: numberOfShares}},
    {upsert: true, new: true}
   );
  const updatedStockAccount = await stockAccountModel.findOneAndUpdate(filter, { $inc: { quantity: -numberOfShares }}, {new: true});

  // log accountTransaction
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
  const stockReserveAccount = await reserveAccountModel.findOne({ userID: userId, action: "sell", symbol: stockSymbol })
  // const stockReserveAccount = user.reserveAccount.find(account => account.action === "sell" && account.symbol === stockSymbol && account.status !== "cancelled" && account.status !== "completed")

  if (!stockReserveAccount) {
    const error = "User must have specified a SET_SELL_AMOUNT prior to running SET_SELL_TRIGGER";
    logController.logError('SET_SELL_TRIGGER', request.body.userID, numDoc, error);
    return response
      .status(400)
      .send(
        error
      );
  }
  // const filter = {
  //   userID: userId
  // }
  // let update = {$set: {"reserveAccount.$[elem].status": "triggered", "reserveAccount.$[elem].triggerPrice": triggerPrice}};
  // const options = {arrayFilters: [{ "elem.action": "sell", "elem.symbol": stockSymbol, "elem.status": {$nin: ["cancelled", "completed"]} }], new: true}
  // const updatedUser = await userModel.findOneAndUpdate(filter, update, options);
  const filter = {
    userID: userId,
    symbol: stockSymbol,
    action: "sell",
  }
  let update = {$set: {"status": true, "triggerPrice": triggerPrice}};
  const options = { upsert: true, new: true }
  const updatedStockAccount = await reserveAccountModel.findOneAndUpdate(filter, update, options);
  response.status(200).send(updatedStockAccount);

  // todo: now starts checking for the stock price continually
  // if stock price exceeded or equals to triggerPrice, run the SELL command to sell that stock

  const quoteCommand = `${stockSymbol},${userId}\n`;
  netClient.write(`SUBSCRIBE ${userId} ${stockSymbol}`)
  await subscriber.subscribe(stockSymbol, async (currentStockPrice) => {
    console.log(`Current ${stockSymbol} price: ${currentStockPrice}`)
    if (Number(currentStockPrice) >= triggerPrice) {
      netClient.write(`CANCEL ${userId} ${stockSymbol}`)
      console.log(`stockReserveAccpunt ${stockReserveAccount}`);
      console.log(`stockReserveAccpunt.amountReserved: ${stockReserveAccount.amountReserved}`);
      // console.log(`stockReserveAccpunt.amountReserved: ${stockReserveAccount.amountReserved}`);
      await transactionController.sellStockForSet(userId, stockSymbol, stockReserveAccount.amountReserved, triggerPrice);
      await transactionController.commitSellStockForSet(userId, Number(currentStockPrice), stockReserveAccount.amountReserved, numDoc);
      console.log(`${stockSymbol} sold at ${userId}`);
      
      // reserveAccountModel.findByIdAndDelete(updatedUser._id, );
      reserveAccountModel.findByIdAndDelete(stockReserveAccount._id, {}, (err, doc) => {
        if (err) {
          console.error(err);
        }
      });
    }
  })
  // const worker = createWorker(quoteCommand);

  // // Send the quote server command to the worker thread
  // worker.postMessage(quoteCommand);
  // // Listening to the worker thread for any response from quote server
  // worker.on("message", async (stockPrice) => {
  //   console.log("SELL - Current price for stock: " + stockPrice + "Triggerprice: " + triggerPrice);
  //   if (Number(stockPrice) >= triggerPrice) {
  //     worker.terminate();
  //     workerMap.delete(quoteCommand);
  //     // Todo: sell stock
  //     await transactionController.sellStockForSet(userId, stockSymbol, stockReserveAccount.amountReserved, triggerPrice);
  //     await transactionController.commitSellStockForSet(userId, numDoc);
  //     //
  //     console.log("Stock sold")
  //     update = {$set: {"reserveAccount.$[elem].status": "completed"}};
  //     await userModel.findOneAndUpdate(filter, update, options);
  //   }
  // })
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
  const stockReserveAccount = await reserveAccountModel.findOne({ userID: userId, action: "sell", symbol: stockSymbol })
  const filter = {
    userID: userId,
    symbol: stockSymbol
  }
  // const stockReserveAccount = user.reserveAccount.find(account => account.action === "sell" && account.symbol === stockSymbol && (account.status === "init" || account.status === "triggered"))
  if (!stockReserveAccount) {
    const error = "No SET_SELL commands specified";
    logController.logError('CANCEL_SET_SELL', request.body.userID, numDoc, error);
    return response.status(400).send(error);
  } else {
    // const worker = workerMap.get(`${stockSymbol},${userId}\n`);
    // if (worker) {
    //   worker.terminate();
    //   workerMap.delete(`${stockSymbol},${userId}\n`);
    //   console.log("SET_SELL command cancelled");
    // }
    netClient.write(`CANCEL ${userId} ${stockSymbol}`)
    console.log("SET_SELL command cancelled");
    console.log(stockReserveAccount);
    const updatedStockAccount = await stockAccountModel.findOneAndUpdate(filter, { $inc: { balance: stockReserveAccount.amountReserved }}, {new: true});
    reserveAccountModel.findByIdAndDelete(stockReserveAccount._id, {}, (err, doc) => {
      if (err) {
        console.error(err);
      }
    });
    // let update = {$set: { "reserveAccount.$[elem].status": "cancelled" }};
    // const options = {arrayFilters: [{ "elem.action": "sell", "elem.symbol": stockSymbol, "elem.status": {$nin: ["cancelled", "completed"]} }], new: true}
    // await userModel.findOneAndUpdate(filter, update, options);
    // const updatedUser = await userModel.findOneAndUpdate(filter, { $inc: { "stocksOwned.$[elem].quantity": stockReserveAccount.amountReserved }}, {arrayFilters: [{ "elem.symbol": stockSymbol }], new: true});
  
    // log accountTransaction
    logController.logSystemEvent("CANCEL_SET_SELL",request,numDoc);
    logController.logTransactions("add", request, numDoc);
    response.status(200).send(updatedStockAccount);
  }
};

// // Delete all the users
// exports.deleteAllUsers = async (request, response) => {
//   await userModel.deleteMany({});
//   response.status(200).send("All users deleted");
// };
