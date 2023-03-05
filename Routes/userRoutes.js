const express = require("express");
const router = express.Router();
const userController = require("../Controllers/userController");

// Route for adding a new user
router.post("/users", userController.addUser);

// Route for getting all users
router.get("/users", userController.getAllUsers);

// Route for getting a specific user by userId
router.get("/users/:userID", userController.getUserByUserId);

// Route for updating a specific user by userId
router.put("/users/:userID", userController.updateUserByUserId);

module.exports = router;
