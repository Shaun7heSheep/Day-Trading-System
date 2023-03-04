const mongoose = require("mongoose");

const quoteserverSchema = new mongoose.Schema({
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
  price: { // funds
    type: Number
  },
  stockSymbol: { //stockSymbol
    type: String
  },
  username: { // username
    type: String,
    required: true
  },
  quoteServerTime: { // username
    type: Number
  },
  cryptokey: {
    type: String,
    required: true
  }
},
    { timestamps: true }
);

const quoteServerModel = mongoose.model("quoteServerModel", quoteserverSchema);
