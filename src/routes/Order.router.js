const express = require("express");
const { addOrder, getallOrders,getOrderByDate, drivergetOrderByDate, getOrdersByPage, getOrderStats, markOrdersPaid, getOrderStatsOverMonth, getRevenueStatsOverTime, getOrderStatsOverCustom, getRevStatsOverCustom } = require("./Order.controller.js");
const { protect } = require("../utils/auth.js");
const { verifyToken, verifyAdminToken } = require("../utils/token.js");

const router = express.Router();

router.post("/api/order/add",verifyToken, addOrder);
router.post("/api/order/getorderbydate",verifyAdminToken, getOrderByDate);
router.post("/api/order/getbypage",verifyAdminToken, getOrdersByPage);
router.post("/api/order/orderstats",verifyAdminToken, getOrderStats);
router.post("/api/order/monthlystats", verifyAdminToken,getOrderStatsOverMonth);
router.post("/api/order/customorders",verifyAdminToken, getOrderStatsOverCustom);
router.post("/api/order/customrevenue",verifyAdminToken, getRevStatsOverCustom);
router.post("/api/order/revstats",verifyAdminToken, getRevenueStatsOverTime);
router.post("/api/order/updatestatus",verifyAdminToken, markOrdersPaid);
router.post("/api/order/drivergetorderbydate",verifyToken, drivergetOrderByDate);



module.exports = router;
