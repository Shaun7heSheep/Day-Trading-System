const express = require("express");
const router = express.Router();
const transactionController = require("../Controllers/transactionController");

// Route for adding a new transaction
router.post("/transactions", transactionController.addTransaction);

// Route for buying a stock
router.post("/buy", transactionController.buy);

// Route for getting all transactions
router.get("/transactions", transactionController.getAllTransactions);

module.exports = router;
