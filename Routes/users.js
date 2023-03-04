const express = require("express");
const userModel = require("../Models/users");
const app = express();

app.post("/add_user", async (request, response) => {
    try {
      // insert new if not exist, else increase balance
      const updatedUser = await userModel.findOneAndUpdate(
        {userID: request.body.userID},
        {$inc:{balance: request.body.balance}},
        {upsert:true, returnDocument:"after"}
      )
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