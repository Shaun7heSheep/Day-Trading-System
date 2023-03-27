const userModel = require("../Models/users");
const logController = require("./logController");
const transactionNumController = require("./transactNumController");
const transactionController = require("./transactionController");
const { Worker } = require("worker_threads");

// Add a new user
exports.addUser = async (request, response) => {
  console.log(request.body.userID);
  console.log(request.body.amount);
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum()
  // log user command
  logController.logUserCmnd("ADD", request, numDoc.value);
  try {
    // insert new if not exist, else increase balance
    const updatedUser = await userModel.findOneAndUpdate(
      { _id: request.body.userID },
      { $inc: { balance: Number(request.body.amount) } },
      { new: true, upsert: true }
    );
    // log accountTransaction
    await logController.logTransactions("add", request, numDoc.value);
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
// exports.setBuyAmount = async (request, response) => {
//   // get and update current transactionNum
//   var numDoc = await transactionNumController.getNextTransactNum()
//   // log user command
//   logController.logUserCmnd("SET_BUY_AMOUNT", request, numDoc.value);
//   const stockSymbol = request.body.symbol;
//   const stockAmount = Number(request.body.amount);
//   const userId = request.body.userID;
//   const user = await userModel.findOne({ userID: userId });
//   if (!user) {
//     return response.status(404).send("User not found");
//   }
//   if (user.balance < stockAmount) {
//     return response.status(400).send("Insufficient balance");
//   }


//   const filter = {
//     userID: userId
//   }
//   const stockReserveAccount = user.reserveAccount.find(account => account.action === "buy" && account.symbol === stockSymbol && account.status !== "cancelled" && account.status !== "completed")
//   if (!stockReserveAccount) {
//     await userModel.findOneAndUpdate(
//       filter,
//       { $push: { reserveAccount: { action: 'buy', symbol: stockSymbol, amountReserved: stockAmount, status: "init" } } },
//       { new: true }
//     );
//   } else {
//     let update = {$inc: {"reserveAccount.$[elem].amountReserved": stockAmount }};
//     const options = {arrayFilters: [{ "elem.action": "buy", "elem.symbol": stockSymbol, "elem.status": {$nin: ["cancelled", "completed"]} }], new: true}
//     await userModel.findOneAndUpdate(filter, update, options);
//   }

//   const updatedUser = await userModel.findOneAndUpdate(filter, { $inc: { balance: -stockAmount }}, {new: true});
//   // log accountTransaction
//   logController.logSystemEvent("SET_BUY_AMOUNT",request,numDoc.value);
//   logController.logTransactions("remove", request, numDoc.value);

//   response.status(200).send(updatedUser);
// };

// // SET_BUY_TRIGGER
// exports.setBuyTrigger = async (request, response) => {
//   // get and update current transactionNum
//   var numDoc = await transactionNumController.getNextTransactNum()
//   // log user command
//   logController.logUserCmnd("SET_BUY_TRIGGER", request, numDoc.value);
//   const stockSymbol = request.body.symbol;
//   const triggerPrice = Number(request.body.amount);
//   const userId = request.body.userID;
//   const user = await userModel.findOne({ userID: userId });
//   if (!user) {
//     return response.status(404).send("User not found");
//   }
//   const stockReserveAccount = user.reserveAccount.find(account => account.action === "buy" && account.symbol === stockSymbol && account.status !== "cancelled" && account.status !== "completed")
//   if (!stockReserveAccount) {
//     const error = "User must have specified a SET_BUY_AMOUNT prior to running SET_BUY_TRIGGER";
//     logController.logError('SET_BUY_TRIGGER', request.body.userID, numDoc.value, error);
//     return response
//       .status(400)
//       .send(
//         error
//       );
//   }

//   const filter = {
//     userID: userId
//   }
//   let update = {$set: {"reserveAccount.$[elem].status": "triggered", "reserveAccount.$[elem].triggerPrice": triggerPrice}};
//   const options = {arrayFilters: [{ "elem.action": "buy", "elem.symbol": stockSymbol, "elem.status": {$nin: ["cancelled", "completed"]} }], new: true}
//   const updatedUser = await userModel.findOneAndUpdate(filter, update, options);
//   response.status(200).send(updatedUser);

//   // todo: now starts checking for the stock price continually
//   // if stock price dropped below triggerPrice, run the BUY command to buy that stock

//   const quoteCommand = `${stockSymbol},${userId}\n`;
//   const worker = createWorker(quoteCommand);

//   // Send the quote server command to the worker thread
//   worker.postMessage(quoteCommand);
//   // Listening to the worker thread for any response from quote server
//   worker.on("message", async (stockPrice) => {
//     console.log("Current price for stock: " + stockPrice + " Trgger price: " + triggerPrice);
//     if (Number(stockPrice) <= triggerPrice) {
//       worker.terminate();
//       workerMap.delete(quoteCommand);
//       // Todo: buy stock
//       await transactionController.buyStockForSet(userId, stockSymbol, stockReserveAccount.amountReserved, triggerPrice);
//       await transactionController.commitBuyForSet(userId, stockPrice);
//       //
//       console.log("Stock purchased")
//       update = {$set: {"reserveAccount.$[elem].status": "completed"}};
//       await userModel.findOneAndUpdate(filter, update, options);
//     }
//   })
// };

// // CANCEL_SET_BUY
// exports.cancelSetBuy = async (request, response) => {
//   // get and update current transactionNum
//   var numDoc = await transactionNumController.getNextTransactNum()
//   // log user command
//   logController.logUserCmnd("CANCEL_SET_BUY", request, numDoc.value);
//   const stockSymbol = request.body.symbol;
//   const userId = request.body.userID;
//   const user = await userModel.findOne({ userID: userId });
//   if (!user) {
//     return response.status(404).send("User not found");
//   }

//   const filter = {
//     userID: userId
//   }
//   const stockReserveAccount = user.reserveAccount.find(account => account.action === "buy" && account.symbol === stockSymbol && (account.status === "init" || account.status === "triggered"))
//   if (!stockReserveAccount) {
//     const error = "No SET_BUY commands specified";
//     logController.logError('CANCEL_SET_BUY', request.body.userID, numDoc.value, error);
//     return response.status(400).send(error);
//   } else {
//     const worker = workerMap.get(`${stockSymbol},${userId}\n`);
//     if (worker) {
//       worker.terminate();
//       workerMap.delete(`${stockSymbol},${userId}\n`);
//       console.log("SET_BUY command cancelled");
//     }
  
//     let update = {$set: { "reserveAccount.$[elem].status": "cancelled" }};
//     const options = {arrayFilters: [{ "elem.action": "buy", "elem.symbol": stockSymbol, "elem.status": {$nin: ["cancelled", "completed"]} }], new: true}
//     await userModel.findOneAndUpdate(filter, update, options);
    
//     const updatedUser = await userModel.findOneAndUpdate(filter, { $inc: { balance: stockReserveAccount.amountReserved }}, {new: true});
//     // log accountTransaction
//     logController.logSystemEvent("CANCEL_SET_BUY",request,numDoc.value);
//     logController.logTransactions("add", request, numDoc.value);
//     response.status(200).send(updatedUser);
//   }
// };

// // SET_SELL_AMOUNT
// exports.setSellAmount = async (request, response) => {
//   // get and update current transactionNum
//   var numDoc = await transactionNumController.getNextTransactNum()
//   // log user command
//   logController.logUserCmnd("SET_SELL_AMOUNT", request, numDoc.value);
//   const stockSymbol = request.body.symbol;
//   const numberOfShares = Number(request.body.amount);
//   const userId = request.body.userID;
//   const user = await userModel.findOne({ userID: userId });
//   if (!user) {
//     return response.status(404).send("User not found");
//   }
//   const stock = user.stocksOwned.find(stock => stock.symbol === stockSymbol);
//   if (!stock || stock.quantity < numberOfShares) {
//     return response.status(400).send("Insufficient number of shares");
//   }

//   const filter = {
//     userID: userId
//   }
//   const stockReserveAccount = user.reserveAccount.find(account => account.action === "sell" && account.symbol === stockSymbol && account.status !== "cancelled" && account.status !== "completed")
//   if (!stockReserveAccount) {
//     await userModel.findOneAndUpdate(
//       filter,
//       { $push: { reserveAccount: { action: 'sell', symbol: stockSymbol, amountReserved: numberOfShares, status: "init" } } },
//       { new: true }
//     );
//   } else {
//     let update = {$inc: {"reserveAccount.$[elem].amountReserved": numberOfShares }};
//     const options = {arrayFilters: [{ "elem.action": "sell", "elem.symbol": stockSymbol, "elem.status": {$nin: ["cancelled", "completed"]} }], new: true}
//     await userModel.findOneAndUpdate(filter, update, options);
//   }

//   const updatedUser = await userModel.findOneAndUpdate(filter, { $inc: { "stocksOwned.$[elem].quantity": -numberOfShares }}, {arrayFilters: [{ "elem.symbol": stockSymbol }], new: true});

//   // log accountTransaction
//   logController.logTransactions("remove", request, numDoc.value);

//   response.status(200).send(updatedUser);
// };

// // SET_SELL_TRIGGER
// exports.setSellTrigger = async (request, response) => {
//   // get and update current transactionNum
//   var numDoc = await transactionNumController.getNextTransactNum()
//   // log user command
//   logController.logUserCmnd("SET_SELL_TRIGGER", request, numDoc.value);
//   const stockSymbol = request.body.symbol;
//   const triggerPrice = Number(request.body.amount);
//   const userId = request.body.userID;
//   const user = await userModel.findOne({ userID: userId });
//   if (!user) {
//     return response.status(404).send("User not found");
//   }
//   const stockReserveAccount = user.reserveAccount.find(account => account.action === "sell" && account.symbol === stockSymbol && account.status !== "cancelled" && account.status !== "completed")

//   if (!stockReserveAccount) {
//     const error = "User must have specified a SET_SELL_AMOUNT prior to running SET_SELL_TRIGGER";
//     logController.logError('SET_SELL_TRIGGER', request.body.userID, numDoc.value, error);
//     return response
//       .status(400)
//       .send(
//         error
//       );
//   }
//   const filter = {
//     userID: userId
//   }
//   let update = {$set: {"reserveAccount.$[elem].status": "triggered", "reserveAccount.$[elem].triggerPrice": triggerPrice}};
//   const options = {arrayFilters: [{ "elem.action": "sell", "elem.symbol": stockSymbol, "elem.status": {$nin: ["cancelled", "completed"]} }], new: true}
//   const updatedUser = await userModel.findOneAndUpdate(filter, update, options);
//   response.status(200).send(updatedUser);

//   // todo: now starts checking for the stock price continually
//   // if stock price exceeded or equals to triggerPrice, run the SELL command to sell that stock

//   const quoteCommand = `${stockSymbol},${userId}\n`;
//   const worker = createWorker(quoteCommand);

//   // Send the quote server command to the worker thread
//   worker.postMessage(quoteCommand);
//   // Listening to the worker thread for any response from quote server
//   worker.on("message", async (stockPrice) => {
//     console.log("SELL - Current price for stock: " + stockPrice + "Triggerprice: " + triggerPrice);
//     if (Number(stockPrice) >= triggerPrice) {
//       worker.terminate();
//       workerMap.delete(quoteCommand);
//       // Todo: sell stock
//       await transactionController.sellStockForSet(userId, stockSymbol, stockReserveAccount.amountReserved, triggerPrice);
//       await transactionController.commitSellStockForSet(userId, numDoc);
//       //
//       console.log("Stock sold")
//       update = {$set: {"reserveAccount.$[elem].status": "completed"}};
//       await userModel.findOneAndUpdate(filter, update, options);
//     }
//   })
// };

// // CANCEL_SET_SELL
// exports.cancelSetSell = async (request, response) => {
//   var numDoc = await transactionNumController.getNextTransactNum()
//   logController.logUserCmnd("CANCEL_SET_SELL", request, numDoc.value);
//   const stockSymbol = request.body.symbol;
//   const userId = request.body.userID;
//   const user = await userModel.findOne({ userID: userId });
//   if (!user) {
//     return response.status(404).send("User not found");
//   }

//   const filter = {
//     userID: userId
//   }
//   const stockReserveAccount = user.reserveAccount.find(account => account.action === "sell" && account.symbol === stockSymbol && (account.status === "init" || account.status === "triggered"))
//   if (!stockReserveAccount) {
//     const error = "No SET_SELL commands specified";
//     logController.logError('CANCEL_SET_SELL', request.body.userID, numDoc.value, error);
//     return response.status(400).send(error);
//   } else {
//     const worker = workerMap.get(`${stockSymbol},${userId}\n`);
//     if (worker) {
//       worker.terminate();
//       workerMap.delete(`${stockSymbol},${userId}\n`);
//       console.log("SET_SELL command cancelled");
//     }
  
//     let update = {$set: { "reserveAccount.$[elem].status": "cancelled" }};
//     const options = {arrayFilters: [{ "elem.action": "sell", "elem.symbol": stockSymbol, "elem.status": {$nin: ["cancelled", "completed"]} }], new: true}
//     await userModel.findOneAndUpdate(filter, update, options);
//     const updatedUser = await userModel.findOneAndUpdate(filter, { $inc: { "stocksOwned.$[elem].quantity": stockReserveAccount.amountReserved }}, {arrayFilters: [{ "elem.symbol": stockSymbol }], new: true});
  
//     // log accountTransaction
//     logController.logSystemEvent("CANCEL_SET_SELL",request,numDoc.value);
//     logController.logTransactions("add", request, numDoc.value);
//     response.status(200).send(updatedUser);
//   }
// };

// // Delete all the users
// exports.deleteAllUsers = async (request, response) => {
//   await userModel.deleteMany({});
//   response.status(200).send("All users deleted");
// };
