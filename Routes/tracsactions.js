const express = require("express");
const transactionModel = require("../Models/accountTransaction.model");
const app = express();

var net = require('net');

app.get("/quote", async (request, response) => {
  let userID = request.query.user_id;
  let symbol = request.query.symbol;

  try {
    quoteData = getQuote(userID, symbol)
    response.status(200).send(quoteData)
  } catch (error) {
    response.status(500).send(error);
  }
});


// Connect to QuoteServer and get quote
function getQuote(userID, symbol) {
  var client = net.createConnection({
    host: 'quoteserve.seng.uvic.ca',
    port: 4444
  })

  client.on('connect', () => { client.write(`${symbol},${userID}\n`) })
  client.on('data', async (data) => { 
    console.log(data)
    return (data) 
  })

}

module.exports = app;