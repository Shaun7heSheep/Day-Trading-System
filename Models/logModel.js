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
            funds: String
        },
        accountTransaction:{
            timestamp: String,
            server: String,
            transactionNum: Number,
            action: String,
            username: String,
            funds: String
        },
        quoteServer:{
            timestamp: String,
            server: String,
            transactionNum: Number,
            price: String,
            stockSymbol: String,
            username: String,
            quoteServerTime: String,
            cryptoKey: String
        },
        errorEvent:{
            timestamp: String,
            server: String,
            transactionNum: Number,
            command: String,
            username: String,
            stockSymbol: String,
            filename: String,
            funds: String,
            errorMessage: String
        },
        systemEvent:{
            timestamp: String,
            server: String,
            transactionNum: Number,
            command: String,
            username: String,
            stockSymbol: String,
            filename: String,
            funds: String
        }
    }, {versionKey: false}
);

module.exports = mongoose.model("log", logSchema);