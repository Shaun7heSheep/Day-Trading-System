const transactionModel = require("../Models/transactions");
const userModel = require("../Models/users");

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


exports.buyStock = async (request, response) => {
  try {
    let userID = request.body.userID;
    let symbol = request.body.symbol;
    let amount = request.body.amount;
    const user = await userModel.findOne({ userID: userID });
    if (!user) {
      return response.status(404).send(user);
    }

    if (user.balance >= amount){
      // let quoteData = await getQuote(userID, symbol);
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
};


exports.commitBuyStock = async (request, response) => {
  const currentTime = Math.floor(new Date().getTime() / 1000) 
  try {
    const latestTransaction = await transactionModel.findOneAndUpdate(
      {userID: request.body.userID},
      {status: "init"},
      {sort: { 'createdAt' : -1 }},
    )
    const transactionTime = Math.floor(new Date(latestTransaction.createdAt).getTime() / 1000)
    if ((currentTime - transactionTime) <= 60) {
      latestTransaction.status = "commited"
      const updatedUser = await userModel.findOneAndUpdate(
        { userID: request.body.userID },
        { $inc: { balance: - (latestTransaction.price * latestTransaction.amount) } },
        { returnDocument: "after" }
      );
      if (!updatedUser) {
        return response.status(404).send("Cannot find user");
      }

      await latestTransaction.save()
      response.status(200).send(updatedUser);
      
    } else {
      response.status(400).send("Buy request is expired or not initialized")
    }
  
  } catch (error) {
    response.status(500).send(error);
  }
};


exports.cancelBuyStock = async (request, response) => {
  const currentTime = Math.floor(new Date().getTime() / 1000) 
  try {
    const latestTransaction = await transactionModel.findOneAndUpdate(
      {userID: request.body.userID},
      {status: "init"},
      {sort: { 'createdAt' : -1 }},
    )
    const transactionTime = Math.floor(new Date(latestTransaction.createdAt).getTime() / 1000)
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
}

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
    })
    client.on('error', (err) => {reject(err)})
  })
}