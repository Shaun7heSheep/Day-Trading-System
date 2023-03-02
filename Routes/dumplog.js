const express = require("express");
const app = express();

app.get("/dump", (request, response) => {
    var userID = request.query.userID;
    if (userID) {
        response.send(`dumped! ${userID}\n`)
    } else {
        response.sendFile('logfile.xsd', { root: './log'});
    }
});

module.exports = app;