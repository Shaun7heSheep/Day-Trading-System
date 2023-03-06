const mongoose = require("mongoose");

const accTransactSchema = new mongoose.Schema(
    {
        timestamp: String,
        server: String,
        transactionNum: Number,
        action: String,
        username: String,
        funds: Number
    }
);

module.exports = mongoose.model("accountTransaction", accTransactSchema);