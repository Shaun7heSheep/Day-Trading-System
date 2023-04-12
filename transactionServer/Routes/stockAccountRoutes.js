const express = require("express");
const router = express.Router();
const stockAccountController = require("../Controllers/stockAccountController")

// Route for getting an user account
router.get("/stockaccount", stockAccountController.getOneUserAccount);

module.exports = router;
