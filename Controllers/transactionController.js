const transactionModel = require("../Models/transactions");
const quoteController = require("./quoteController");

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
