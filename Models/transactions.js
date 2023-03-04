const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  transaction_id: {
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
},
    { timestamps: true }
);

const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;