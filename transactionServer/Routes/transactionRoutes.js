const express = require("express");
const router = express.Router();
const transactionController = require("../Controllers/transactionController");

// Route for getting all transactions
router.get("/transactions", transactionController.getAllTransactions);

router.post("/display_summary", transactionController.getTransactionSummary);

router.post("/buy", transactionController.buyStock);

router.post("/sell", transactionController.sellStock);

router.post("/commit_buy", transactionController.commitBuyStock);

router.post("/commit_sell", transactionController.commitSellStock);

router.post("/cancel_buy", transactionController.cancelBuyStock);

router.post("/cancel_sell", transactionController.cancelSellStock);

// router.delete("/transactions", transactionController.deleteTransactions);

module.exports = router;
