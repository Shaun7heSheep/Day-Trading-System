const mongoose = require("mongoose");

const accTransactSchema = new mongoose.Schema(
    {
        timestamp: {$t:String},
        server: {$t:String},
        transactionNum: {$t:String},
        action: {$t:String},
        username: {$t:String},
        funds: {$t:Number}
    }, {versionKey: false}
);

module.exports = mongoose.model("accountTransaction", accTransactSchema);