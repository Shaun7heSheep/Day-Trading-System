const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  transaction_id: {
    type: Number,
    index: true,
    required: true,
    auto: true,
  },
  userID: {
    type: String,
    required: true
  },
  command: {
    type: String
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

const dumplog = mongoose.model("dumplog", logSchema);

module.exports = dumplog;