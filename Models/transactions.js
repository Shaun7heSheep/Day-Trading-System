const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  transaction_id: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    required: true,
    auto: true,
  },
  user_id: {
    type: Number,
    default: 0,
  },
  symbol: {
    type: String,
  },
  amount: {
    type: Number,
    default: 2.0,
  },
  price: {
    type: Number,
    default: 0,
  },
  type: {
    type: String,
  }
},
    { timestamps: true }
);

const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;