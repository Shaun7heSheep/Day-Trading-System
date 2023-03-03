const mongoose = require("mongoose");

const userCommandSchema = new mongoose.Schema({
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
  command: {
    type: String,
    required: true
  },
  username: { // username
    type: String,
    required: true
  },
  stockSymbol: {
    type: String,
  },
  filename: {
    type: String
  },
  funds: {
    type: Number
  }
},
    { timestamps: true }
);

const userCommandModel = mongoose.model("userCommandModel", userCommandSchema);

module.exports = userCommandModel;