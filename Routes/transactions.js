const express = require("express");
const transactionModel = require("../Models/transactions");
const userModel = require("../Models/users");
const app = express();

var net = require('net');


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

  try {
    quoteData = await getQuote(userID, symbol)
    response.status(200).send(quoteData)
  } catch (error) {
    response.status(500).send(error);
  }
});


// Connect to QuoteServer and get quote
function getQuote(userID, symbol) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({
      host: 'quoteserve.seng.uvic.ca',
      port: 4444
    })
    client.on('connect', () => {client.write(`${symbol},${userID}\n`)})
    client.on('data', (data) => {
      var response = data.toString('utf-8')
      resolve(response);
      var arr = response.split(',');

      // store quoteserver response for logging
      // quoteServerModel.create({
      //   timestamps: Date.now(),
      //   price: arr[0], 
      //   username: userID, 
      //   stockSymbol: symbol, 
      //   quoteServerTime: arr[3], 
      //   cryptokey: arr[4]
      // })
    })
    client.on('error', (err) => {reject(err)})
  })
}

module.exports = app;