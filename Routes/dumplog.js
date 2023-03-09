const express = require("express");
const fs = require("fs")
const parser = require("xml2json")
const formatXml = require("xml-formatter")
const router = express.Router();
const quoteServerModel = require("../Models/quoteServer")
const transactNumModel = require("../Models/transactNum")
const userCmdModel = require("../Models/userCommand")
const accTransactModel = require("../Models/accountTransaction")

router.get("/dump", async (request, response) => {
    var userID = request.query.userID;
    if (userID) {
        response.send(`dumped! ${userID}\n`)
    } else {
        var userCommand = await userCmdModel.find({},'-_id')
        var accountTransaction = await accTransactModel.find({},'-_id')
        var logObj = {
          log:{
            userCommand: userCommand,
            accountTransaction: accountTransaction
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
    }
});

// Route for deleting all the user log
router.delete("/dump", async (req, res) => {
  await userCmdModel.deleteMany({});
  await accTransactModel.deleteMany({});
  await quoteServerModel.deleteMany({});
  await transactNumModel.deleteMany({});
  res.status(200).send("All logs deleted");
});



// module.exports = app;
module.exports = router;
