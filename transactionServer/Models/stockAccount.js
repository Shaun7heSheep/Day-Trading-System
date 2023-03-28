const mongoose = require("mongoose");

const StockAccountSchema = new mongoose.Schema(
    {
        userID: {
            type: String,
            required: true,
        },
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
    { timestamps: true }
);

StockAccountSchema.index({ userID: 1, symbol: 1 }, { unique: true });
const StockAccount = mongoose.model("StockAccount", StockAccountSchema);

module.exports = StockAccount;
