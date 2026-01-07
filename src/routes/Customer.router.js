const express = require("express");
const { registerCustomer, getAllCustomers,getCustomersByPage, getAllStats, getCustomerStats, overviewCustomers, updateCustomer, deleteCustomer } = require("./Customer.controller.js");
const { protect } = require("../utils/auth.js");
const { verifyAdminToken } = require("../utils/token.js");

const router = express.Router();

router.post("/api/cust/update",verifyAdminToken, updateCustomer);
router.post("/api/cust/add",verifyAdminToken, registerCustomer);

router.post("/api/cust/delete",verifyAdminToken, deleteCustomer);
router.post("/api/cust/allstats",verifyAdminToken, getAllStats);
router.post("/api/cust/growthstats",verifyAdminToken, getCustomerStats);
router.post("/api/cust/overview",verifyAdminToken, overviewCustomers);
router.post("/api/cust/getall",verifyAdminToken, getAllCustomers);
router.post("/api/cust/getcustbypage",verifyAdminToken, getCustomersByPage);




module.exports = router;
