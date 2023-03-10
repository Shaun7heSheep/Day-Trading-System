const express = require("express");
const router = express.Router();
const transactionController = require("../Controllers/transactionController");

// Route for adding a new transaction
router.post("/transactions", transactionController.addTransaction);

// Route for getting all transactions
router.get("/transactions", transactionController.getAllTransactions);

router.get("/display_summary", transactionController.getTransactionSummary);

router.post("/buy", transactionController.buyStock);

router.post("/sell", transactionController.sellStock);

router.post("/commit_buy", transactionController.commitBuyStock);

router.post("/commit_sell", transactionController.commitSellStock);

router.post("/cancel_buy", transactionController.cancelBuyStock);

module.exports = router;
