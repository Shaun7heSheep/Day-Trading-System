const express = require("express");
const app = express();

app.get("/dump", (request, response) => {
    var userID = request.query.userID;
    if (userID) {
        response.send(`dumped! ${userID}\n`)
    } else {
        response.sendFile('../user1.txt')
    }
});

module.exports = app;