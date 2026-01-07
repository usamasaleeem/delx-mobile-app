const express = require("express");
const { registerComp, loginComp, logout, checkAuth } = require("./Comp.controller.js");
const { protect } = require("../utils/auth.js");
const { verifyAdminToken } = require("../utils/token.js");

const router = express.Router();

router.post("/api/comp/add", registerComp);
router.post("/api/comp/login", loginComp);
router.post("/api/comp/check-auth",verifyAdminToken, checkAuth);
router.post("/api/comp/logout", logout);




module.exports = router;
