const mongoose = require("mongoose");

const ReservedAccountSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
      required: true,
    },
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
      type: Boolean,
      default: false, // 2 status: true/false
    },
  },
  { timestamps: true }
);

ReservedAccountSchema.index({ userID: 1, symbol: 1 }, { unique: true });
const ReservedAccount = mongoose.model("ReservedAccount", ReservedAccountSchema);

module.exports = ReservedAccount;
