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
  action: {
    type: String,
    required: true
  },
  username: { // username
    type: String,
    required: true
  },
  funds: {
    type: Number
  }
});

const accountTransaction = mongoose.model("accountTransaction", accountTransactionSchema);

module.exports = accountTransaction;