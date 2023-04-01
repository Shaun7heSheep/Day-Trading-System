const express = require("express");
const router = express.Router();
const stockAccountController = require("../Controllers/stockAccountController")

// Route for adding a new user
router.get("/stockaccount", stockAccountController.getOneUserAccount);

// // Route for getting all users
// router.get("/users", userController.getAllUsers);

module.exports = router;
