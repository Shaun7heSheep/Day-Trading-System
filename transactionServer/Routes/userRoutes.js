const express = require("express");
const router = express.Router();
const userController = require("../Controllers/userController");

// Route for adding a new user
router.post("/users", userController.addUser);

// Route for getting all users
router.get("/users", userController.getAllUsers);

// Route for getting a specific user by userId
// router.get("/users/:userID", userController.getUserByUserId);

// // Route for updating a specific user by userId
// router.put("/users/:userID", userController.updateUserByUserId);

// // Route for deleting all the users
// router.delete("/users", userController.deleteAllUsers);

// // Route for setting the buy amount
 router.post("/set-buy-amount", userController.setBuyAmount);

// // Route for setting the buy trigger
// router.post("/set-buy-trigger", userController.setBuyTrigger);

// // Route for cancelling the SET_BUY commands
// router.post("/cancel-set-buy", userController.cancelSetBuy);

// // Route for setting the sell amount
// router.post("/set-sell-amount", userController.setSellAmount);

// // Route for setting the sell trigger
// router.post("/set-sell-trigger", userController.setSellTrigger);

// // Route for cancelling the SET_SELL commands
// router.post("/cancel-set-sell", userController.cancelSetSell);

module.exports = router;
