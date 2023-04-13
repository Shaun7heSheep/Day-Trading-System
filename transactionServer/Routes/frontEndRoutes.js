const express = require('express');
const router = express.Router();
const reservedAccountModel = require("../Models/reserveAccount");


router.get("/login", (req, res) => {
    res.render("pages/login", { cache: true });
});

router.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/daytrading/login")
});

router.get("/:userID/trading", (req, res) => {
    const sessionData = req.session;
    const userID = req.params.userID;
    const balance = req.query.balance;

    if (typeof balance !== "undefined") {
        sessionData.balance = balance;
    }
    sessionData.userID = userID;    
    res.render("pages/trading", {
        userID: userID,
        balance: sessionData.balance,
        currentPage: `/${userID}/trading`
    });
})

router.get("/:userID/trading/:symbol", async (req, res) => {
    const sessionData = req.session;
    const userID = req.params.userID;
    const symbol = req.params.symbol;
    const quantity = req.query.quantity;
    const balance = req.query.balance;
    if (typeof quantity !== "undefined") {
        sessionData.quantity = quantity;
    }
    if (typeof balance !== "undefined") {
        sessionData.balance = balance;
    }

    const userReserveAccounts = await reservedAccountModel.find({ userID: userID, symbol: symbol });
    console.log(userReserveAccounts)
    res.render("pages/symbolTrading", {
        userID: userID,
        balance: sessionData.balance,
        reservedAccounts: userReserveAccounts,
        symbol: symbol,
        quantity: sessionData.quantity,
        currentPage: `/${userID}/trading`
    })
})

router.get("/:userID/trading/:symbol/commitbuy", async (req, res) => {
    const sessionData = req.session;
    const userID = req.params.userID;
    const symbol = req.params.symbol;
    const amount = req.query.amount;
    const price = req.query.price;
    const quantity = req.query.quantity;

    res.render("pages/commit", {
        userID: userID,
        amount: amount,
        symbol: symbol,
        price: price,
        action: "Buy",
        quantity: quantity
    })
})

router.get("/:userID/trading/:symbol/commitsell", async (req, res) => {
    const sessionData = req.session;
    const userID = req.params.userID;
    const symbol = req.params.symbol;
    const amount = req.query.amount;
    const price = req.query.price;
    const quantity = req.query.quantity;

    res.render("pages/commit", {
        userID: userID,
        amount: amount,
        symbol: symbol,
        price: price,
        action: "Sell",
        quantity: quantity
    })
})

router.get("/:userID/addbalance", (req, res) => {
    const sessionData = req.session;
    const userID = req.params.userID;
    var balance = 0 ;
    if (typeof req.query.balance !== "undefined") {
        balance = req.query.balance;
        sessionData.balance = balance;
    } else {
        balance = sessionData.balance;
    }
    sessionData.userID = userID;

    res.render("pages/addBalance", {
        userID: userID,
        balance: balance,
        currentPage: `/${userID}/addbalance`
    });
})

module.exports = router;
