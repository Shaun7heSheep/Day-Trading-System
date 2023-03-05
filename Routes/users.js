const express = require("express");
const userModel = require("../Models/users");
const helpers = require("../helpers")

const app = express();

app.post("/add_user", async (request, response) => {
    helpers.logUserCmd("ADD",request);
    try {
      // insert new if not exist, else increase balance
      const updatedUser = await userModel.findOneAndUpdate(
        {userID: request.body.userID},
        {$inc:{balance: request.body.balance}},
        {upsert:true, returnDocument:"after"}
      )
      console.log(updatedUser)
      response.status(200).send(updatedUser);
    } catch (error) {
      response.status(500).send(error);
    }
});

app.get("/users", async (request, response) => {
    const users = await userModel.find({});
  
    try {
      response.send(users);
    } catch (error) {
      response.status(500).send(error);
    }
});

module.exports = app;
