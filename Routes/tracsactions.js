const express = require("express");
const transactionModel = require("../Models/transactions");
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

app.get("/transactions", async (request, response) => {
    const transactions = await transactionModel.find({});
  
    try {
      response.send(transactions);
    } catch (error) {
      response.status(500).send(error);
    }
});

module.exports = app;