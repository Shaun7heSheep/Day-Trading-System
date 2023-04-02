
const axios = require("axios");
const express = require('express');
const router = express.Router();


router.get("/daytrading/login", (req, res) => {
    res.render("pages/login", { cache: true });
});

router.get("/daytrading/logout", (req, res) => {
    req.session.destroy();
    res.clearCookie("connect.sid", { maxAge: 0 })
    res.redirect("/daytrading/login")
});

router.get("/daytrading/:userID/trading", (req, res) => {
    const sessionData = req.session;
    const userID = req.params.userID;
    const balance = req.query.balance;

    if (typeof balance !== "undefined") {
        sessionData.balance = balance;
    }
    sessionData.userID = userID;

    console.log(`My session balance: ${sessionData.balance}`);
    res.render("pages/trading", {
        userID: userID,
        balance: sessionData.balance,
        currentPage: `/daytrading/${userID}/trading`
    });
})

router.get("/daytrading/:userID/trading/:symbol", (req, res) => {
    const sessionData = req.session;
    const userID = req.params.userID;
    const symbol = req.params.symbol;
    axios.get(`http://localhost:3000/stockaccount?userID=${userID}&symbol=${symbol}`)
        .then(function (response) {
            const { quantity } = response.data;
            // console.log(`${userID}, ${balance}`);
            res.render("pages/symbolTrading", {
                userID: userID,
                balance: sessionData.balance,
                symbol: symbol,
                quantity: quantity,
                currentPage: `/daytrading/${userID}/trading`
            });
            // window.location.replace(`/daytrading/${userID}/trading`);
        })
        .catch((err) => {
            console.error(`Axios error: ${err}`)
        })
})

router.get("/daytrading/:userID/addbalance", (req, res) => {
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
        currentPage: `/daytrading/${userID}/addbalance`
    });
})

module.exports = router;
