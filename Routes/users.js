const express = require("express");
const userModel = require("../Models/users");
const app = express();

app.post("/add_user", async (request, response) => {
    const user = new userModel(request.body);
    const doesUserExit = await userModel.exists({ userID: request.body.userID });
    console.log(doesUserExit)
    if (doesUserExit == null) {
      try {
        await user.save();
        response.send(user);
      } catch (error) {
        response.status(500).send(error);
      }
    }
    
    else{
      userModel.findOne({ userID: request.body.userID}, function (err, user) {
        if (err){
            console.log(err);
        }
        else{
            let new_balance = user.balance + request.body.balance
            console.log(new_balance)
            user.balance = new_balance;
            user.save();
            response.status(200).send("Balance updated successfully");
        }
      });
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