const express = require("express");
const transactionModel = require("../Models/transactions");
const userModel = require("../Models/users");
const helpers = require("../helpers")
const app = express();


app.post("/add_transaction", async (request, response) => {
    const transaction = new transactionModel(request.body);
    try {
      await transaction.save();
      response.send(transaction);
    } catch (error) {
      response.status(500).send(error);
    }
});

app.post("/buy", async (request, response) => {
  const buyTransaction = new transactionModel(request.body);
  try {
    await buyTransaction.save();
    response.send(buyTransaction);
  } catch (error) {
    response.status(500).send(error);
  }
});

app.get("/transactions", async (request, response) => {
    const transactions = await transactionModel.find({});
    try {
      response.send(transactions);
    } catch (error) {
      response.status(500).send(error);
    }
});

app.get("/quote", async (request, response) => {
  let userID = request.query.user_id;
  let symbol = request.query.symbol;

  try {
    quoteData = await helpers.getQuote(userID, symbol)
    response.status(200).send(quoteData)
  } catch (error) {
    response.status(500).send(error);
  }
});

module.exports = app;