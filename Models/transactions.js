const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  transaction_id: {
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
},
    { timestamps: true }
);

const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;