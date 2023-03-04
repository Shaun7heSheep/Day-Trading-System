const mongoose = require("mongoose");

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
  userID: {
    type: String,
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    default: 2.0,
  },
  server: {
    type: String,
    default: 'ownserver'
  },
  quoteserver_timestamp: {
    type: String
  },
  cryptokey: {
    type: String
  }
});

const AccountTransaction = mongoose.model("Transaction", accountTransactionSchema);

module.exports = AccountTransaction;
