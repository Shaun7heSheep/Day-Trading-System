const userModel = require("../Models/users");
const logController = require("./logController");
const transactionNumController = require("./transactNumController");
const transactionController = require("./transactionController");
const { Worker } = require("worker_threads");

// Add a new user
exports.addUser = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum()
  // log user command
  logController.logUserCmnd("ADD", request, numDoc.value);
  try {
    // insert new if not exist, else increase balance
    const updatedUser = await userModel.findOneAndUpdate(
      { userID: request.body.userID },
      { $inc: { balance: request.body.amount } },
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
exports.getUserByUserId = async (request, response) => {
  try {
    const user = await userModel.findOne({ userID: request.params.userID });
    if (!user) {
      return response.status(404).send(user);
    }
    response.status(200).send(user);
  } catch (error) {
    response.status(500).send(error);
  }
};

// Update a specific user by userId
exports.updateUserByUserId = async (request, response) => {
  try {
    const updatedUser = await userModel.findOneAndUpdate(
      { userID: request.body.userID },
      request.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedUser) {
      return response.status(404).send(updatedUser);
    }
    response.status(200).send(updatedUser);
  } catch (error) {
    response.status(500).send(error);
  }
};

// A map to store the worker thread
// key: `${stockSymbol},${userId}\n`
// value: the worker thread
const workerMap = new Map();
const createWorker = (quoteCommand) => {
  const worker = new Worker("./Controllers/worker.js");
  workerMap.set(quoteCommand, worker);

  return worker;
}

// SET_BUY_AMOUNT
exports.setBuyAmount = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum()
  // log user command
  logController.logUserCmnd("SET_BUY_AMOUNT", request, numDoc.value);
  const stockSymbol = request.body.symbol;
  const stockAmount = Number(request.body.amount);
  const userId = request.body.userID;
  const user = await userModel.findOne({ userID: userId });
  if (!user) {
    return response.status(404).send("User not found");
  }
  if (user.balance < stockAmount) {
    return response.status(400).send("Insufficient balance");
  }

  let stockReserveAccountExists = false;
  // Iterate the object in user's reserveAccount.
  // If reserveAccount already exists for that specific stock, increment the amountReserved
  user.reserveAccount.forEach((account) => {
    if (
      account.action === "buy" &&
      account.symbol === stockSymbol &&
      account.status !== "cancelled" &&
      account.status !== "completed"
    ) {
      //let amountReserved = Number(account.amountReserved);
      //account.amountReserved = amountReserved + Number(stockAmount);
      account.amountReserved += stockAmount;
      stockReserveAccountExists = true;
    }
  });

  // Else, create the reserve account for that specific stock
  if (!stockReserveAccountExists) {
    user.reserveAccount.push({
      action: "buy",
      symbol: stockSymbol,
      amountReserved: stockAmount,
      status: "init",
    });
  }

  user.balance -= stockAmount;
  // log accountTransaction
  logController.logSystemEvent("SET_BUY_AMOUNT",request,numDoc.value);
  logController.logTransactions("remove", request, numDoc.value);

  const updatedUser = await user.save();
  response.status(200).send(updatedUser);
};

// SET_BUY_TRIGGER
exports.setBuyTrigger = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum()
  // log user command
  logController.logUserCmnd("SET_BUY_TRIGGER", request, numDoc.value);
  const stockSymbol = request.body.symbol;
  const triggerPrice = Number(request.body.amount);
  const userId = request.body.userID;
  const user = await userModel.findOne({ userID: userId });
  if (!user) {
    return response.status(404).send("User not found");
  }
  let stockReserveAccountExists = false;
  var stockReserveAccount;
  user.reserveAccount.forEach((account) => {
    if (
      account.action === "buy" &&
      account.symbol === stockSymbol &&
      account.status !== "cancelled" &&
      account.status !== "completed"
    ) {
      account.triggerPrice = triggerPrice;
      account.status = "triggered";
      stockReserveAccountExists = true;
      stockReserveAccount = account;
    }
  });

  if (!stockReserveAccountExists) {
    const error = "User must have specified a SET_BUY_AMOUNT prior to running SET_BUY_TRIGGER";
    logController.logError('SET_BUY_TRIGGER', request.body.userID, numDoc.value, error);
    return response
      .status(400)
      .send(
        error
      );
  }
  var updatedUser = await user.save();
  response.status(200).send(updatedUser);

  // todo: now starts checking for the stock price continually
  // if stock price dropped below triggerPrice, run the BUY command to buy that stock

  const quoteCommand = `${stockSymbol},${userId}\n`;
  const worker = createWorker(quoteCommand);

  // Send the quote server command to the worker thread
  worker.postMessage(quoteCommand);
  // Listening to the worker thread for any response from quote server
  worker.on("message", async (stockPrice) => {
    console.log("Current price for stock: " + stockPrice + " Trgger price: " + triggerPrice);
    if (Number(stockPrice) <= triggerPrice) {
      worker.terminate();
      workerMap.delete(quoteCommand);
      // Todo: buy stock
      await transactionController.buyStockForSet(userId, stockSymbol, stockReserveAccount.amountReserved, triggerPrice);
      await transactionController.commitBuyForSet(userId, stockPrice);
      //
      console.log("Stock purchased")
      stockReserveAccount.status = "completed";
      updatedUser = await user.save();
    }
  })
};

// CANCEL_SET_BUY
exports.cancelSetBuy = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum()
  // log user command
  logController.logUserCmnd("CANCEL_SET_BUY", request, numDoc.value);
  const stockSymbol = request.body.symbol;
  const userId = request.body.userID;
  const user = await userModel.findOne({ userID: userId });
  if (!user) {
    return response.status(404).send("User not found");
  }
  let stockReserveAccountExists = false;
  user.reserveAccount.forEach((account) => {
    if (
      account.action === "buy" &&
      account.symbol === stockSymbol &&
      (account.status === "init" || account.status === "triggered")
    ) {
      const worker = workerMap.get(`${stockSymbol},${userId}\n`);
      if (worker) {
        worker.terminate();
        workerMap.delete(`${stockSymbol},${userId}\n`);
        console.log("SET_BUY command cancelled");
      }
      user.balance += account.amountReserved;
      // log accountTransaction
      logController.logSystemEvent("CANCEL_SET_BUY",request,numDoc.value);
      logController.logTransactions("add", request, numDoc.value);
      account.status = "cancelled";
      stockReserveAccountExists = true;
    }
  });

  if (!stockReserveAccountExists) {
    const error = "No SET_BUY commands specified";
    logController.logError('CANCEL_SET_BUY', request.body.userID, numDoc.value, error);
    return response.status(400).send(error);
  }
  const updatedUser = await user.save();
  response.status(200).send(updatedUser);
};

// SET_SELL_AMOUNT
exports.setSellAmount = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum()
  // log user command
  logController.logUserCmnd("SET_SELL_AMOUNT", request, numDoc.value);
  const stockSymbol = request.body.symbol;
  const numberOfShares = request.body.amount;
  const userId = request.body.userID;
  const user = await userModel.findOne({ userID: userId });
  if (!user) {
    return response.status(404).send("User not found");
  }
  const stock = user.stocksOwned.find(stock => stock.symbol === stockSymbol);
  if (!stock || stock.quantity < numberOfShares) {
    return response.status(400).send("Insufficient number of shares");
  }

  let stockReserveAccountExists = false;
  // Iterate the object in user's reserveAccount.
  // If reserveAccount already exists for that specific stock, increment the amountReserved
  user.reserveAccount.forEach((account) => {
    if (
      account.action === "sell" &&
      account.symbol === stockSymbol &&
      account.status !== "cancelled" &&
      account.status !== "completed"
    ) {
      account.amountReserved += numberOfShares;
      stockReserveAccountExists = true;
    }
  });

  // Else, create the reserve account for that specific stock
  if (!stockReserveAccountExists) {
    user.reserveAccount.push({
      action: "sell",
      symbol: stockSymbol,
      amountReserved: numberOfShares,
      status: "init",
    });
  }

  stock.quantity -= numberOfShares;
  // log accountTransaction
  logController.logTransactions("remove", request, numDoc.value);

  const updatedUser = await user.save();
  response.status(200).send(updatedUser);
};

// SET_SELL_TRIGGER
exports.setSellTrigger = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum()
  // log user command
  logController.logUserCmnd("SET_SELL_TRIGGER", request, numDoc.value);
  const stockSymbol = request.body.symbol;
  const triggerPrice = Number(request.body.amount);
  const userId = request.body.userID;
  const user = await userModel.findOne({ userID: userId });
  if (!user) {
    return response.status(404).send("User not found");
  }
  let stockReserveAccountExists = false;
  var stockReserveAccount;
  user.reserveAccount.forEach((account) => {
    if (
      account.action === "sell" &&
      account.symbol === stockSymbol &&
      account.status !== "cancelled" &&
      account.status !== "completed"
    ) {
      account.triggerPrice = triggerPrice;
      account.status = "triggered";
      stockReserveAccountExists = true;
      stockReserveAccount = account;
    }
  });

  if (!stockReserveAccountExists) {
    const error = "User must have specified a SET_SELL_AMOUNT prior to running SET_SELL_TRIGGER";
    logController.logError('SET_SELL_TRIGGER', request.body.userID, numDoc.value, error);
    return response
      .status(400)
      .send(
        error
      );
  }
  var updatedUser = await user.save();
  response.status(200).send(updatedUser);

  // todo: now starts checking for the stock price continually
  // if stock price exceeded or equals to triggerPrice, run the SELL command to sell that stock

  const quoteCommand = `${stockSymbol},${userId}\n`;
  const worker = createWorker(quoteCommand);

  // Send the quote server command to the worker thread
  worker.postMessage(quoteCommand);
  // Listening to the worker thread for any response from quote server
  worker.on("message", async (stockPrice) => {
    console.log("SELL - Current price for stock: " + stockPrice + "Triggerprice: " + triggerPrice);
    if (Number(stockPrice) >= triggerPrice) {
      worker.terminate();
      workerMap.delete(quoteCommand);
      // Todo: sell stock
      await transactionController.sellStockForSet(userId, stockSymbol, stockReserveAccount.amountReserved, triggerPrice);
      await transactionController.commitSellStockForSet(userId, numDoc);
      //
      console.log("Stock sold")
      stockReserveAccount.status = "completed";
      updatedUser = await user.save();
    }
  })
};

// CANCEL_SET_SELL
exports.cancelSetSell = async (request, response) => {
  var numDoc = await transactionNumController.getNextTransactNum()
  logController.logUserCmnd("CANCEL_SET_SELL", request, numDoc.value);
  const stockSymbol = request.body.symbol;
  const userId = request.body.userID;
  const user = await userModel.findOne({ userID: userId });
  if (!user) {
    return response.status(404).send("User not found");
  }
  let stockReserveAccountExists = false;
  user.reserveAccount.forEach((account) => {
    if (
      account.action === "sell" &&
      account.symbol === stockSymbol &&
      (account.status === "init" || account.status === "triggered")
    ) {
      const stock = user.stocksOwned.find(stock => stock.symbol === stockSymbol);
      stock.quantity += account.amountReserved;
      // log accountTransaction
      logController.logTransactions("add", request, numDoc.value);
      account.status = "cancelled";
      stockReserveAccountExists = true;
      const worker = workerMap.get(`${stockSymbol},${userId}\n`);
      if (worker) {
        worker.terminate();
        workerMap.delete(`${stockSymbol},${userId}\n`);
        console.log("SET_SELL command cancelled");
      }
    }
  });

  if (!stockReserveAccountExists) {
    const error = "No SET_SELL commands specified";
    logController.logError('CANCEL_SET_SELL', request.body.userID, numDoc.value, error);
    return response.status(400).send(error);
  }
  const updatedUser = await user.save();
  response.status(200).send(updatedUser);
};

// Delete all the users
exports.deleteAllUsers = async (request, response) => {
  await userModel.deleteMany({});
  response.status(200).send("All users deleted");
};
