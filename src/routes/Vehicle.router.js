const express = require("express");
const { registerVehicle, getAllVehicles, getVehiclesByPage, updateVehicle, getTotalVehicleCapacity, deleteVehicle } = require("./Vehicle.controller.js");
const { protect } = require("../utils/auth.js");
const { verifyAdminToken } = require("../utils/token.js");

const router = express.Router();

router.post("/api/veh/add",verifyAdminToken, registerVehicle);
router.post("/api/veh/delete",verifyAdminToken, deleteVehicle);

router.post("/api/veh/update",verifyAdminToken, updateVehicle);


router.post("/api/veh/getbypage",verifyAdminToken, getVehiclesByPage);
router.post("/api/veh/getall",verifyAdminToken, getAllVehicles);


module.exports = router;
