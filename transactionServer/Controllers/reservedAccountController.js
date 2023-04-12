const reservedAccountModel = require("../Models/reserveAccount");
const redisController = require("./redisController")
const transactionNumController = require("./transactNumController");
const logController = require("./logController");
const quoteController = require("./quoteController");
const cache = require("../Redis/redis_init")

exports.getReservedAccounts = async (req, res) => {
    try {
        const userReserveAccounts = await reservedAccountModel.find({ userID: req.query.userID, symbol: req.query.symbol });
        // response.render("index", { data: users });
        if (!userReserveAccounts) {
            return res.status(200).send("No reserved accounts" );
        }
        // res.status(200).send(userReserveAccount);
        res.status(200).send( userReserveAccounts );
    } catch (error) {
        res.status(500).send(error);
    }
};