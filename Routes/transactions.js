const express = require("express");
const transactionModel = require("../Models/transactions");
const quoteController = require("../Controllers/quoteController");
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
  try {
    let userID = request.body.userID;
    let symbol = request.body.symbol;
    let amount = request.body.amount;
    console.log(userID)
    const user = await userModel.findOne({ userID: userID });
    console.log(user)
    if (!user) {
      return response.status(404).send(user);
    }

    if (user.balance >= amount){
      // let quoteData = await quoteController.getQuote(userID, symbol);
      // let quoteDataArr = quoteData.split(",")

      const buyTransaction = new transactionModel(request.body);
      buyTransaction.action = "buy";
      // buyTransaction.price = quoteDataArr[0];
    
      await buyTransaction.save();
      response.status(200).send(buyTransaction);
    } else {
      response.status(400).send("User does not have enough money in the balance")
    }
    

  } catch (error) {
    response.status(500).send(error);
  }
});


app.post("/commit_buy", async (request, response) => {
 
  const currentTime = Math.floor(new Date().getTime() / 1000) 
  try {
    const latestTransaction = await transactionModel.findOneAndUpdate(
      {userID: request.body.userID},
      {status: "init"},
      {sort: { 'createdAt' : -1 }},
    )
    // console.log(currentTime)
    // console.log(latestTransaction)

    const transactionTime = Math.floor(new Date(latestTransaction.createdAt).getTime() / 1000)

    // console.log(transactionTime)

    if ((currentTime - transactionTime) <= 60) {
      latestTransaction.status = "commited"
      const updatedUser = await userModel.findOneAndUpdate(
        { userID: request.body.userID },
        { $inc: { balance: - (latestTransaction.price * latestTransaction.amount) } },
        { returnDocument: "after" }
      );
      await latestTransaction.save()
      response.status(200).send(updatedUser);
      
    } else {
      response.status(400).send("Buy request is expired or not initialized")
    }
  
  } catch (error) {
    response.status(500).send(error);
  }
});


app.post("/cancel_buy", async (request, response) => {
  const currentTime = Math.floor(new Date().getTime() / 1000) 
  try {
    const latestTransaction = await transactionModel.findOneAndUpdate(
      {userID: request.body.userID},
      {status: "init"},
      {sort: { 'createdAt' : -1 }},
    )
    // console.log(currentTime)
    // console.log(latestTransaction)

    const transactionTime = Math.floor(new Date(latestTransaction.createdAt).getTime() / 1000)

    // console.log(transactionTime)

    if ((currentTime - transactionTime) <= 60) {
      latestTransaction.status = "cancelled"
      await latestTransaction.save()
      response.status(200).send(latestTransaction);
      
    } else {
      response.status(400).send("Buy request is expired or not initialized")
    }
  
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