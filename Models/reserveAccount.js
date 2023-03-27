const mongoose = require("mongoose");

const ReservedAccountSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
      required: true,
    },
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
          default: 0
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

const ReservedAccount = mongoose.model("ReservedAccount", ReservedAccountSchema);

module.exports = ReservedAccount;
