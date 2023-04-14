const express = require("express");
const router = express.Router();
const logController = require("../Controllers/logController");

router.post("/dump", logController.dumplog);

// Route for deleting all the user log
router.delete("/dump", logController.deleteAllLog);

module.exports = router;
