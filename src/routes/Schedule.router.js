const express = require("express");
const { addSchedule, getallSchedules, route,getSchByDate, getSchByDriver, getScheduleStats, getSchByPage, getDeliveryStats, updateSchedule, deleteSchedule } = require("./Schedule.controller.js");
const { protect } = require("../utils/auth.js");
const { verifyToken, verifyAdminToken } = require("../utils/token.js");

const router = express.Router();

router.post("/api/schedule/add",verifyAdminToken, addSchedule);
router.post("/api/schedule/delete",verifyAdminToken, deleteSchedule);
router.post("/api/schedule/deliverystats",verifyAdminToken, getDeliveryStats);
router.post("/api/schedule/getbydate",verifyAdminToken, getSchByDate);
router.post("/api/schedule/getbypage",verifyAdminToken, getSchByPage);
router.post("/api/schedule/getstats",verifyAdminToken, getScheduleStats);



router.post("/api/schedule/update",verifyAdminToken, updateSchedule);
router.post("/api/schedule/getbydriver",verifyToken, getSchByDriver);



module.exports = router;
