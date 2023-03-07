const userModel = require("../Models/users");
const logController = require("./logController")
const transactionNumController = require("./transactNumController")

// Add a new user
exports.addUser = async (request, response) => {
  // get and update current transactionNum
  var numDoc = await transactionNumController.getNextTransactNum()
  // log user command
  logController.logUserCmnd("ADD",request,numDoc.value);
  try {
    // insert new if not exist, else increase balance
    const updatedUser = await userModel.findOneAndUpdate(
      { userID: request.body.userID },
      { $inc: { balance: request.body.balance } },
      { new: true, upsert: true }
    );
    // log accountTransaction
    logController.logTransactions("add", request, numDoc.value);
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
