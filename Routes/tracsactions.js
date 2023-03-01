const express = require("express");
const transactionModel = require("../Models/transactions");
const app = express();

var net = require('net');
var client = net.createConnection({
  host: 'quoteserve.seng.uvic.ca',
  port: 4444
})

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

app.get("/quote", async (request, response) => {
  let userID = request.query.user_id;
  let symbol = request.query.symbol;

  client.on('connect', () => {
    console.log('Connected to server');
    client.write(`${symbol},${userID}\n`);
  })

  client.on('data', (data) => {
      console.log('Received data from server ');
      try {
        response.send(data.toString('utf-8'));
      } catch (error) {
        response.status(500).send(error);
      }
  });
  client.on('end', function() {
      console.log('Disconnected');
  });
});


module.exports = app;