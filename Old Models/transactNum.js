const mongoose = require("mongoose");

const transactionNum = new mongoose.Schema(
    {
        _id: String,
        value: Number
    }, {versionKey: false}
);
module.exports = mongoose.model("transactionNum", transactionNum);