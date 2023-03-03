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
    default: 0,
  },
  server: {
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
    default: 'ownserver'
  },
  quoteserver_timestamp: {
    type: String
  },
  cryptokey: {
    type: String
  }
});

const AccountTransaction = mongoose.model("User", accountTransactionSchema);

module.exports = AccountTransaction;
