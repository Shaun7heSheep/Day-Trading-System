const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
    {
        userCommand:{
            timestamp: String,
            server: String,
            transactionNum: String,
            command: String,
            username: String,
            stockSymbol: String,
            filename: String,
            funds: String
        },
        accountTransaction:{
            timestamp: String,
            server: String,
            transactionNum: String,
            action: String,
            username: String,
            funds: String
        },
        quoteServer:{
            timestamp: String,
            server: String,
            transactionNum: String,
            price: String,
            stockSymbol: String,
            username: String,
            quoteServerTime: String,
            cryptoKey: String
        }
        //errorEvent:{},
        //systemEvent:{}
    }, {versionKey: false}
);

module.exports = mongoose.model("log", logSchema);