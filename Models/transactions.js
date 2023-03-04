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
  const buy_transaction = new transactionModel(request.body);
  try {
    await transaction.save();
    response.send(transaction);
  } catch (error) {
    response.status(500).send(error);
  }
});

app.post("/commitSell", async (request, response) => {
  /*
  ...
  */
});

app.get("/quote", async (request, response) => {
  let userID = request.query.user_id;
  let symbol = request.query.symbol;

const accountTransactionSchema = new mongoose.Schema({
  timestamps: {
    type: Number
  },
  server: {
    type: String,
    default: 'ownserver'
  },
  transactionNum: { // transactionNum
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    auto: true,
  },
  user_id: {
    type: String,
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    default: 0,
  },
  // 'buy' or 'sell'
  action: {
    type: String,
  },
  isTrigger: {
    type: Boolean,
    default: false
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
      quoteServerModel.create({
        timestamps: Date.now(),
        price: arr[0], 
        username: userID, 
        stockSymbol: symbol, 
        quoteServerTime: arr[3], 
        cryptokey: arr[4]
      })
    })
    client.on('error', (err) => {reject(err)})
  })
}

module.exports = app;