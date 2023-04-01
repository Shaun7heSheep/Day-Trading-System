const transactionModel = require("../Models/transactions");
const userModel = require("../Models/users");
const stockAccountModel = require("../Models/stockAccount");
const redisController = require("./redisController")
const transactionNumController = require("./transactNumController");
const logController = require("./logController");
const quoteController = require("./quoteController");
const cache = require("../Redis/redis_init")

exports.getOneUserAccount = async (req, res) => {
    try {
        const userStockAccount = await stockAccountModel.findOne({ userID: req.query.userID, symbol: req.query.symbol });
        // response.render("index", { data: users });
        if (!userStockAccount) {
            return res.status(200).send({ quantity: 0 });
        }
        res.status(200).send({ quantity: userStockAccount.quantity });
    } catch (error) {
        res.status(500).send(error);
    }
};