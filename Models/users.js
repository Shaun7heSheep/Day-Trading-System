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
    reserveAccount: [
      {
        action: {
          type: String,
          required: true,
        },
        symbol: {
          type: String,
          required: true,
        },
        amountReserved: {
          type: Number,
          required: true,
        },
        triggerPrice: {
          type: Number,
        },
        status: {
          type: String,
          default: "init", // 4 status: init, triggered, completed, cancelled
        },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
