const mongoose = require("mongoose");

const usercmdSchema = new mongoose.Schema(
    {
        timestamp:{$t:String},
        server: {$t:String},
        transactionNum: {$t:String},
        command: {$t:String},
        username: {$t:String},
        stockSymbol: {$t:String},
        filename: {$t:String},
        funds: {$t:String}
    }, {versionKey: false}
)

module.exports = mongoose.model("userCommand", usercmdSchema);