const express = require("express");
const logModel = require("../Models/log")
const app = express();

app.get("/dump", (request, response) => {
    var userID = request.query.userID;
    if (userID) {
        response.send(`dumped! ${userID}\n`)
    } else {
        logModel.find({}, function(err,docs) {
            if (err) {response.status(500).send(err)}
            else {response.status(200).send(docs)}
        })
    }
});

module.exports = app;