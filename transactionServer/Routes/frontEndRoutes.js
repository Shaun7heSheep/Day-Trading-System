
const axios = require("axios");
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
    // console.log("Doing thing");
    const userReserveAccounts = await reservedAccountModel.find({ userID: userID, symbol: symbol });
    console.log(userReserveAccounts)
    res.render("pages/symbolTrading", {
        userID: userID,
        balance: sessionData.balance,
        reservedAccounts: userReserveAccounts,
        symbol: symbol,
        quantity: quantity,
        currentPage: `/${userID}/trading`
    })
    // axios.get(`/daytrading/reservedaccount?userID=${userID}&symbol=${symbol}`)
    // .then((response) => {
    //     const reserveAccounts = response.data;
    //     // console.log(reserveAccounts);
    //     res.render("pages/symbolTrading", {
    //         userID: userID,
    //         balance: sessionData.balance,
    //         reservedAccounts: reserveAccounts,
    //         quantity: quantity,
    //         currentPage: `/${userID}/trading`
    //     });
    // })
    // .catch((err) => {
    //     console.error(`HAHA this is error axios: ${err}`);
    // })
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
