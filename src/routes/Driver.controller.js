
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Driver = require("../models/Driver.model");
const Order = require("../models/Order.model");
const { generateToken } = require("../utils/token");
const Schedule = require("../models/Schedule.model");
const ScheduleModel = require("../models/Schedule.model");
// Register Driver
const registerDriver = async (req, res) => {
  try {
 

  

    const newDriver = new Driver({...req.body,status:'active'});

    await newDriver.save();
    res.status(201).json({ message: "Account created successfully. Status: pending" });
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message });
  }
};
const updateDriver = async (req, res) => {
  try {
    const { activeid, ...data } = req.body; // id + all other fields

    if (!activeid) {
      return res.status(400).json({ message: "Driver ID is required" });
    }

    const updatedDriver = await Driver.findByIdAndUpdate(
      activeid,
      data,                // all fields sent from frontend will update
      { new: true }        // return updated record
    );

    if (!updatedDriver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    return res.status(200).json({
      message: "Driver updated successfully",
      Driver: updatedDriver
    });

  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};

const deleteDriver = async (req, res) => {
  const { activeid, orgid } = req.body;

  try {
    const deleted = await Driver.findOneAndDelete({ _id: activeid, orgid });

    if (!deleted) {
      return res.status(404).json({ message: "Driver not found or orgid mismatch" });
    }

    res.status(200).json({ message: "Driver deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const loginDriver = async (req, res) => {

    console.log(req.body)

  try {
    const { phone, pass } = req.body;

    const driver = await Driver.findOne({ phone });
    if (!driver) return res.status(404).json({ message: "User not found" });

    if (driver.pass !== pass)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({orgid:driver.orgid, id: driver._id, phone: driver.phone,imgurl:driver?.imgurl||"" });
console.log(token)
    res.json({
      message: "Login successful",
      token,
      driver: { id: driver._id, phone: driver.phone,name:driver.name,img:driver?.imgurl },
    });
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message });
  }
};
const getAllDrivers = async (req, res) => {
  const orgid=req.body.orgid
  try {
    const Drivers = await Driver.find({orgid}).sort({ createdAt: -1 }); // newest first
    res.status(200).json(Drivers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getDriverById = async (req, res) => {
  try {
    const { orgid, id } = req.body;
    if (!orgid || !id) {
      return res.status(400).json({ message: "orgid and id are required" });
    }

    const driver = await Driver.findOne({ _id: id, orgid });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    // 🔹 current month range
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const stats = await Order.aggregate([
      {
        $addFields: {
          orderDate: {
            $dateFromString: {
              dateString: "$date",
              format: "%d/%m/%Y"
            }
          }
        }
      },
      {
        $match: {
          orgid,
          driverid: id,
          status: { $in: ["delivered", "cancelled"] },
          orderDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    let deliveredCount = 0;
    let cancelledCount = 0;

    stats.forEach(s => {
      if (s._id === "delivered") deliveredCount = s.count;
      if (s._id === "cancelled") cancelledCount = s.count;
    });

    res.status(200).json({
      driver,
      orderStats: {
        delivered: deliveredCount,
        cancelled: cancelledCount
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const getDriversByPage = async (req, res) => {
  const orgid = req.body.orgid;

  try {
    const page = parseInt(req.body.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // ---- Get date range (current month start to today) ----
    const today = new Date();
    const firstDayStr = new Date(today.getFullYear(), today.getMonth(), 1)
      .toLocaleDateString("en-GB"); // dd/mm/yyyy format

    // ---- Fetch drivers with pagination ----
    const [drivers, total, deliveredCounts] = await Promise.all([
      Driver.find({ orgid })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Driver.countDocuments({ orgid }),

      // ---- Delivered orders count per driver in current month ----
      Order.aggregate([
        {
          $match: {
            orgid,
            status: "delivered",
            date: { $gte: firstDayStr }
          }
        },
        {
          $group: {
            _id: "$driverid",
            deliveredThisMonth: { $sum: 1 }
          }
        }
      ])
    ]);

    // ---- Convert aggregation results to a lookup map ----
    const deliveredMap = {};
    deliveredCounts.forEach(item => {
      deliveredMap[item._id] = item.deliveredThisMonth;
    });

    // ---- Attach delivered count to each driver ----
    const driversWithDelivered = drivers.map(driver => ({
      ...driver._doc,
      deliveredThisMonth: deliveredMap[driver._id] || 0
    }));

    // ---- Send Response ----
    res.status(200).json({
      data: driversWithDelivered,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const getDriverStats = async (req, res) => {
    const orgid=req.body.orgid
  try {
    const [driverCount, scheduleCount, salaryResult] = await Promise.all([
      Driver.countDocuments({orgid}),
      Schedule.countDocuments({orgid}),
      Driver.aggregate([
          { $match: { orgid } },    
        {
          $group: {

            _id: null,
            totalSalary: {
              $sum: {
                $toDouble: "$pay"   // 👈 string to number
              }
            }
          }
        }
      ])
    ]);

    const totalSalary =
      salaryResult.length > 0 ? salaryResult[0].totalSalary : 0;

    const division =
      driverCount > 0 ? scheduleCount / driverCount : 0;

    res.status(200).json({
      routePerDriver: division,
      salary: totalSalary
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



module.exports = {
  deleteDriver,registerDriver,getAllDrivers,getDriverById,
  loginDriver,getDriversByPage,getDriverStats,updateDriver
};
