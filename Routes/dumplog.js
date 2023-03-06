const express = require("express");
const fs = require("fs")
const parser = require("xml2json")
const formatXml = require("xml-formatter")
const userCmdModel = require("../Models/userCommand")
const app = express();

app.get("/dump", async (request, response) => {
    var userID = request.query.userID;
    if (userID) {
        response.send(`dumped! ${userID}\n`)
    } else {
        var userCommand = await userCmdModel.find({})
        var logObj = {
          log:{
            userCommand: userCommand
          }
        }
        const finalXml = parser.toXml(JSON.stringify(logObj))
        fs.writeFile("test.xml", formatXml(finalXml, {collapseContent: true}), function(err, result) {
          if (err) {
            response.status(500).send(err)
          } else {
            response.send("Log file updated")
          }
        })
        /*userCmdModel.find({}, function(err,docs) {
            if (err) {response.status(500).send(err)}
            else {
              return docs
                const finalXml = parser.toXml(JSON.stringify(logObj))
                //console.log(formatXml(finalXml, {collapseContent: true}));
                fs.writeFile("test.json", JSON.stringify(logObj), function(err, result) {
                    if (err) {
                      response.status(500).send(err)
                    } else {
                      response.send("Log file updated")
                    }
                  })
            }
        })*/
    }
});

module.exports = app;
