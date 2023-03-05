const express = require("express");
const router = express.Router();
const quoteController = require("../Controllers/quoteController");

// Route for getting a specific user by userId
router.get("/quote", quoteController.getStockPrice);

module.exports = router;
