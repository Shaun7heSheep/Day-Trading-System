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

const AccountTransaction = mongoose.model("Transaction", accountTransactionSchema);

module.exports = AccountTransaction;
