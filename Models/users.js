const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    stocksOwned: [
      {
        symbol: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
    buyTriggers: [
      {
        symbol: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        trigger_Price: {
          type: Number,
          required: true,
        },
      },
    ],
    sellTriggers: [
      {
        symbol: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        trigger_Price: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
