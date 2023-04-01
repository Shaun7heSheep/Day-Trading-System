
const axios = require("axios");
const express = require('express');
const router = express.Router();


router.get("/daytrading/login", (req, res) => {
    res.render("pages/login", { cache: true });
});

router.get("/daytrading/:userID/trading", (req, res) => {
    const sessionData = req.session;
    const userID = req.params.userID;
    axios.post("http://localhost:3000/users", {
        userID: userID,
        amount: 0
    })
    .then(function (response) {
        const { userID, balance } = response.data;
        sessionData.userID = userID;
        sessionData.balance = balance;
        res.render("pages/trading", {
            userID: userID,
            balance: balance,
            currentPage: `/daytrading/${userID}/trading`
        });
        // window.location.replace(`/daytrading/${userID}/trading`);
    })
    .catch((err) => {
        console.error(`Axios error: ${err}`)
    })
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

module.exports = router;
