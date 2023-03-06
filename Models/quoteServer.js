const mongoose = require("mongoose");

const quoteServerSchema = new mongoose.Schema(
    {
        timestamp: {$t:String},
        server: {$t:String},
        transactionNum: {$t:String},
        price: {$t:String},
        stockSymbol: {$t:String},
        username: {$t:String},
        quoteServerTime: {$t:String},
        cryptoKey: {$t:String}
    }
);

module.exports = mongoose.model("quoteServer", quoteServerSchema);