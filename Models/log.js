const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
    {
        userCommand:{
            timestamp: String,
            server: String,
            transactionNum: Number,
            command: String,
            username: String,
            stockSymbol: String,
            filename: String,
            funds: Number
        },
        accountTransaction:{
            timestamp: String,
            server: String,
            transactionNum: Number,
            action: String,
            username: String,
            funds: Number
        },
        quoteServer:{
            timestamp: String,
            server: String,
            transactionNum: Number,
            price: Number,
            stockSymbol: String,
            username: String,
            quoteServerTime: String,
            cryptoKey: String
        }
    }
);

const dumplog = mongoose.model("Log", logSchema);

module.exports = dumplog;
