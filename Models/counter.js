const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
  },
  transactionNum: {
    type: Number,
    default: 0,
  },
},
);

const counter = mongoose.model("counter", counterSchema);

module.exports = counter;