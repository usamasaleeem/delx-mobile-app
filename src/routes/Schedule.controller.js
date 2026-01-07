
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Schedule = require("../models/Schedule.model");
const axios=require("axios")

const Customer = require("../models/Customer.model");
const Order = require("../models/Order.model");
// Register Schedule
const addSchedule = async (req, res) => {
  console.log(req.body)
  try {
 

  

    const newSchedule = new Schedule({...req.body});

    await newSchedule.save();
    res.status(201).json({ message: "Account created successfully. Status: pending" });
  } catch (err) {
    console.log(err.message)
    res.status(500).json({ message: err.message });
  }
};
const updateSchedule = async (req, res) => {
  try {
    const { id, orgid, ...updateData } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Schedule ID required for update" });
    }
    if (!orgid) {
      return res.status(400).json({ message: "orgid is required" });
    }

    const updated = await Schedule.findOneAndUpdate(
      { _id: id, orgid: orgid },        // check both id + orgid
      { ...updateData, status: "active" },
      { new: true }                     // return updated document
    );

    if (!updated) {
      return res.status(404).json({ message: "Schedule not found or does not belong to this org" });
    }

    res.status(200).json({
      message: "Schedule updated successfully",
      data: updated
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const route = async (req, res) => {
  const { coords } = req.query; // coords="lng1,lat1;lng2,lat2;..."
console.log(coords)
  if (!coords) return res.status(400).json({ error: "Missing coords" });

  try {
    const response = await axios.get(
      `https://router.project-osrm.org/route/v1/driving/${coords}?geometries=geojson`
    );
    res.json(response.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
};
const getallSchedules = async (req, res) => {
  try {
    const Schedules = await Schedule.find().sort({ createdAt: -1 }); // newest first
    res.status(200).json(Schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getScheduleStats = async (req, res) => {
  const orgid = req.body.orgid;
  if (!orgid) return res.status(400).json({ message: "orgid is required" });

  try {
    const today = new Date();

    const todayDay = today.toLocaleDateString("en-US", {
      weekday: "long"
    });

    const todayDate =
      String(today.getDate()).padStart(2, "0") + "/" +
      String(today.getMonth() + 1).padStart(2, "0") + "/" +
      today.getFullYear();

    const stats = await Schedule.aggregate([
      {
        // 🟢 Match only organization data first
        $match: { orgid }
      },
      {
        $facet: {
          // 1️⃣ Total schedules of this org
          totalSchedules: [
            { $count: "count" }
          ],

          // 2️⃣ Today schedules of this org
          todaySchedules: [
            { $match: { days: { $in: [todayDay] } } },
            { $count: "count" }
          ],

          // 3️⃣ Shifts for today (only this org)
          todayShifts: [
            { $match: { days: { $in: [todayDay] } } },
            {
              $lookup: {
                from: "shifts",
                let: { scheduleId: { $toString: "$_id" }, org: "$orgid" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$routeid", "$$scheduleId"] },
                          { $eq: ["$date", todayDate] },
                          { $eq: ["$orgid", "$$org"] } // 👈 Filter inside lookup too
                        ]
                      }
                    }
                  }
                ],
                as: "shifts"
              }
            },
            { $unwind: "$shifts" }
          ]
        }
      },

      // 4️⃣ Process final structure
      {
        $project: {
          totalSchedules: { $arrayElemAt: ["$totalSchedules.count", 0] },
          todaySchedules: { $arrayElemAt: ["$todaySchedules.count", 0] },

          totalShifts: { $size: "$todayShifts" },

          completedShifts: {
            $size: {
              $filter: {
                input: "$todayShifts",
                as: "s",
                cond: {
                  $and: [
                    { $ne: ["$$s.shifts.end", "-"] },
                    { $ne: ["$$s.shifts.end", null] },
                    { $ne: ["$$s.shifts.end", ""] }
                  ]
                }
              }
            }
          },

          inProgressShifts: {
            $size: {
              $filter: {
                input: "$todayShifts",
                as: "s",
                cond: {
                  $or: [
                    { $eq: ["$$s.shifts.end", "-"] },
                    { $eq: ["$$s.shifts.end", null] },
                    { $eq: ["$$s.shifts.end", ""] }
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    res.status(200).json({
      orgid,
      today: todayDay,
      totalSchedules: stats[0].totalSchedules || 0,
      todaySchedules: stats[0].todaySchedules || 0,
      totalShifts: stats[0].totalShifts || 0,
      completedShifts: stats[0].completedShifts || 0,
      inProgressShifts: stats[0].inProgressShifts || 0
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};





const getSchByDate = async (req, res) => {
  try {
    const orgid=req.body.orgid
    const Schedules = await Schedule.find({orgid:orgid,days:req.body.day}).sort({ createdAt: -1 }); // newest first
    res.status(200).json(Schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getSchByDriver = async (req, res) => {
  console.log(req.body);

  try {

    const driverId = req.body.id;
        const orgid = req.body.orgid;
    const day = new Date().toLocaleDateString("en-US", { weekday: "long" });

    const schedules = await Schedule.aggregate([
      // 1️⃣ Match driver, day, and orgid
      {
        $match: {
          driverid: driverId,
          orgid: orgid,
          days: day
        }
      },

      // 2️⃣ Break customers array
      { $unwind: "$customers" },

      // 3️⃣ Convert customer field to ObjectId for lookup
      {
        $addFields: {
          "customers.customerid": {
            $toObjectId: "$customers.customerid"
          }
        }
      },

      // 4️⃣ Lookup customer info
      {
        $lookup: {
          from: "customers",
          localField: "customers.customerid",
          foreignField: "_id",
          as: "customerDetails"
        }
      },
      { $unwind: "$customerDetails" },

      // 5️⃣ Optional: If customer also has orgid, match same org
      {
        $match: {
          "customerDetails.orgid": orgid
        }
      },

      // 6️⃣ Sort by sequence
      { $sort: { "customers.sequence": 1 } },

      // 7️⃣ Group back to rebuild schedule structure
      {
        $group: {
          _id: "$_id",
          driverid: { $first: "$driverid" },
          route: { $first: "$route" },
          vehicleid: { $first: "$vehicleid" },
          frequency: { $first: "$frequency" },
          date: { $first: "$date" },
          area: { $first: "$area" },
          days: { $first: "$days" },
          customers: { $push: "$customerDetails" }
        }
      },

      // 🔚 Sort by creation date
      { $sort: { createdAt: -1 } }
    ]);

    console.log("Schedule Count:", schedules.length);
    res.status(200).json(schedules);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};



const getSchByPage = async (req, res) => {
  try {
    const orgid=req.body.orgid
    const page = parseInt(req.body.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [Schedules, total] = await Promise.all([
      Schedule.find({orgid})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Schedule.countDocuments({orgid})
    ]);

    res.status(200).json({
      data: Schedules,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getDeliveryStats = async (req, res) => {
  const orgid=req.body.orgid
  try {
    const today = new Date();

    const todayDay = today.toLocaleDateString("en-US", {
      weekday: "long"
    });

    const todayDate =
      String(today.getDate()).padStart(2, "0") + "/" +
      String(today.getMonth() + 1).padStart(2, "0") + "/" +
      today.getFullYear();

    /* =========================
       1️⃣ TODAY DELIVERIES (Schedule)
    ========================== */
    const deliveryData = await Schedule.aggregate([
      {
        $match: {
          orgid:orgid,
          days: { $in: [todayDay] }
        }
      },
      { $unwind: "$customers" },
      {
        $lookup: {
          from: "customers",
          let: { 
             org: "$orgid",
            customerId: "$customers.customerid" },
          pipeline: [
            {
              $match: {
                $expr: {
                 $and: [
                    { $eq: [{ $toString: "$_id" }, "$$customerId"] },
                    { $eq: ["$orgid", "$$org"] } // 👈 org filter inside lookup
                  ]
                }
              }
            },
            {
              $project: {
                todaySchedule: `$schedule.${todayDay}`
              }
            },
            {
              $project: {
                deliveryCount: {
                  $cond: [
                    { $isArray: "$todaySchedule" },
                    { $size: "$todaySchedule" },
                    0
                  ]
                }
              }
            }
          ],
          as: "customer"
        }
      },
      { $unwind: "$customer" },
      {
        $group: {
          _id: null,
          totalTodayDeliveries: {
            $sum: "$customer.deliveryCount"
          }
        }
      }
    ]);

    const totalDeliveries =
      deliveryData[0]?.totalTodayDeliveries || 0;

    /* =========================
       2️⃣ TODAY ORDERS (Orders)
    ========================== */
    const ordersData = await Order.aggregate([
      {
        $match: {
          date: todayDate,
          orgid:orgid
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    let totalOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;

    ordersData.forEach(item => {
      totalOrders += item.count;

      if (item._id === "delivered") deliveredOrders = item.count;
      if (item._id === "cancelled") cancelledOrders = item.count;
    });

    /* =========================
       FINAL RESPONSE
    ========================== */
    res.status(200).json({
      day: todayDay,
      date: todayDate,

      deliveries:  totalDeliveries,
      

        totalOrders:totalOrders,
        deliveredOrders:deliveredOrders,
        cancelledOrders:cancelledOrders
 
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteSchedule = async (req, res) => {
  const { activeid, orgid } = req.body;

  try {
    const deleted = await Schedule.findOneAndDelete({ _id: activeid, orgid });

    if (!deleted) {
      return res.status(404).json({ message: "Schedule not found or orgid mismatch" });
    }

    res.status(200).json({ message: "Schedule deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



module.exports = {
 deleteSchedule, addSchedule,getallSchedules,route,getSchByDate,getSchByDriver,
  getScheduleStats,getSchByPage,
  getDeliveryStats,updateSchedule
};
