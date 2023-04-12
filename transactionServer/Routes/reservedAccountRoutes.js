const express = require("express");
const router = express.Router();
const reservedAccountController = require("../Controllers/reservedAccountController");

// Route for getting user's reserved accounts
router.get("/reservedaccount", reservedAccountController.getReservedAccounts);

module.exports = router;
