const express = require("express");
const { registerTransaction, getbypage,driverTranaction, getTransactionStats } = require("./Transaction.controller.js");
const { protect } = require("../utils/auth.js");
const { verifyToken, verifyAdminToken } = require("../utils/token.js");

const router = express.Router();

router.post("/api/trans/add",verifyAdminToken, registerTransaction);
router.post("/api/trans/addbydriver",verifyToken, driverTranaction);
router.post("/api/trans/getbypage",verifyAdminToken, getbypage);

router.post("/api/trans/getstats",verifyAdminToken, getTransactionStats);


module.exports = router;
