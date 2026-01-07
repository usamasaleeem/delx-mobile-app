
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Order = require("../models/Order.model");
const { getFormattedDateTime } = require("../utils/util");
const Customer = require("../models/Customer.model");
// Register Order
const addOrder = async (req, res) => {
  console.log(req.body);

  const { date, time } = getFormattedDateTime();

  try {
    const {
      status,
      custid,
      amount
    } = req.body;

    // 1️⃣ Create order
    const newOrder = new Order({
      ...req.body,
      driverid: req.body.id,
      date,
      time
    });

    await newOrder.save();

    
    // ❌ cancelled → nothing happens

    res.status(201).json({
      message: "Order created successfully",
      status
    });

  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message });
  }
};

const markOrdersPaid = async (req, res) => {
  console.log(req.body);

  try {
    const { ids } = req.body;
    const orgid=req.body.orgid

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No ids provided" });
    }

    let paidCount = 0;
    let failedCount = 0;

    for (const { id, custid, amount } of ids) {
      // 1️⃣ Get customer
      const customer = await Customer.findOne({orgid:orgid,_id:custid});
      if (!customer) {
        failedCount++;
        continue;
      }

      // 2️⃣ Check credits
      if (customer.credits < amount) {
        failedCount++;
        continue;
      }

      // 3️⃣ Deduct credits
      customer.credits -= amount;
      await customer.save();

      // 4️⃣ Mark order paid
      await Order.updateOne(
        { _id: id,orgid:orgid },
        { $set: { paymentstatus: "paid" } }
      );

      paidCount++;
    }

    const total = ids.length;
    const pending = total - paidCount;

    res.status(200).json({
      message: `Payment processed. ${paidCount} paid, ${pending} pending due to insufficient credits.`,
      paidOrders: paidCount,
      pendingOrders: pending
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const getallOrders = async (req, res) => {
  try {
    const Orders = await Order.find().sort({ createdAt: -1 }); // newest first
    res.status(200).json(Orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const parseDDMMYYYY = (dateStr) => {
  const [dd, mm, yyyy] = dateStr.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd);
};

const getOrdersByPage = async (req, res) => {
  const orgid=req.body.orgid

  try {
   
    const page = parseInt(req.body.page) || 1;
const filter=req.body.filter
     const query = {orgid:orgid};

    if (filter.status) {
      if(filter.status==='delivered'||filter.status==='cancelled'){

      query.status = filter.status;
      }
      else{

      query.paymentstatus = filter.status;
      }
    }

    if (filter.driver?._id) {
      query.driverid = filter.driver._id;
    }

    if (filter.cust?._id) {
      query.custid = filter.cust._id;
    }
    if (filter.date?.type === 'single') {
  // Exact date match
  query.date = filter.date.date; 
}

    if (filter.date?.type === 'range') {
      query.$expr = {
        $and: [
          {
            $gte: [
              { $dateFromString: { dateString: "$date", format: "%d/%m/%Y" } },
              parseDDMMYYYY(filter.date.from)
            ]
          },
          {
            $lte: [
              { $dateFromString: { dateString: "$date", format: "%d/%m/%Y" } },
              parseDDMMYYYY(filter.date.to)
            ]
          }
        ]
      };
    }


    const limit = 10;
    const skip = (page - 1) * limit;

    const [Orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query)
    ]);
console.log(Orders.length)
    res.status(200).json({
      data: Orders,
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

const getOrderByDate = async (req, res) => {
  const orgid=req.body.orgid
  try {
    const Orders = await Order.find({orgid:orgid,date:req.body.date}).sort({ createdAt: -1 }); // newest first
    res.status(200).json(Orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getOrderStats = async (req, res) => {

    const orgid=req.body.orgid
  try {
    const filter = req.body.filter || {};
    const matchStage = {orgid:orgid};

    // Status filter (optional)
    if (filter.status) {
    if(filter.status==='delivered'||filter.status==='cancelled'){

      matchStage.status = filter.status;
      }
      else{

      matchStage.paymentstatus = filter.status;
      }
    }

    // Driver filter
    if (filter.driver?._id) {
      matchStage.driverid = filter.driver._id;
    }

    // Customer filter
    if (filter.cust?._id) {
      matchStage.custid = filter.cust._id;
    }

    // ✅ DATE FILTER
    if (filter.date?.type === 'single') {
      matchStage.date = filter.date.date;
    }

    if (filter.date?.type === 'range') {
      matchStage.$expr = {
        $and: [
          {
            $gte: [
              { $dateFromString: { dateString: "$date", format: "%d/%m/%Y" } },
              parseDDMMYYYY(filter.date.from)
            ]
          },
          {
            $lte: [
              { $dateFromString: { dateString: "$date", format: "%d/%m/%Y" } },
              parseDDMMYYYY(filter.date.to)
            ]
          }
        ]
      };
    }

 const stats = await Order.aggregate([
  { $match: matchStage },
  {
    $group: {
      _id: null,

      delivered: {
        $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
      },

      cancelled: {
        $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
      },

      paid: {
        $sum: { $cond: [{ $eq: ["$paymentstatus", "paid"] }, 1, 0] }
      },

      // ✅ TOTAL REVENUE
      totalSales: {
        $sum: {
          $cond: [
        { $eq: ["$status", "delivered"] },
          { $toDouble: "$amount" },
            0
          ]
        }
      },
      totalRevenue: {
        $sum: {
          $cond: [
        { 
            $and: [
          { $eq: ["$paymentstatus", "paid"] },
          { $eq: ["$status", "delivered"] }
        ]
         },
          { $toDouble: "$amount" },
            0
          ]
        }
      }

    }
  }
]);


    res.status(200).json({
      delivered: stats[0]?.delivered || 0,
      cancelled: stats[0]?.cancelled || 0,
      paid: stats[0]?.paid || 0,
       totalSales: stats[0]?.totalSales || 0,
         totalRevenue: stats[0]?.totalRevenue || 0,

       
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const drivergetOrderByDate = async (req, res) => {

  const { date, time } = getFormattedDateTime();
  try {
    const Orders = await Order.find({date:date,driverid:req.body.id}).sort({ createdAt: -1 }); // newest first
    res.status(200).json(Orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// 🧾 Aggregation With Revenue & Status

const getRevenueStatsOverTime = async (req, res) => {
  const orgid = req.body.orgid;
  try {
    const startDate = req.body.start;
    const endDate = req.body.end;

    if (!startDate) {
      return res.status(400).json({ message: "start is required" });
    }

    let dateMatch = {}; // will store date filter only if needed

    // 🟢 If start = "alltime" (no date filter)
    if (startDate !== "alltime") {
      const start = new Date(startDate.split("/").reverse().join("-"));
      const end = endDate && endDate !== "alltime"
        ? new Date(endDate.split("/").reverse().join("-"))
        : start;

      dateMatch = { date: { $gte: start, $lte: end } };
    }

    const data = await Order.aggregate([
      {
        $addFields: {
          date: {
            $dateFromString: {
              dateString: "$date",
              format: "%d/%m/%Y"
            }
          },
          amountNum: { $toDouble: "$amount" }
        }
      },
      {
        $match: {
          orgid,
          ...dateMatch // apply only when not alltime
        }
      },
      {
        $group: {
          _id: null,
          deliveredRevenue: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, "$amountNum", 0] }
          },
          paidRevenue: {
            $sum: { $cond: [{ $eq: ["$paymentstatus", "paid"] }, "$amountNum", 0] }
          },
          pendingRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "delivered"] },
                    { $eq: ["$paymentstatus", "pending"] }
                  ]
                },
                "$amountNum",
                0
              ]
            }
          }
        }
      }
    ]);

    const result = data[0] || {
      deliveredRevenue: 0,
      paidRevenue: 0,
      pendingRevenue: 0
    };

    res.json({
      period: startDate === "alltime" ? "All Time" : `${startDate} → ${endDate || startDate}`,
      totalDeliveredRevenue: result.deliveredRevenue,
      paidRevenue: result.paidRevenue,
      pendingRevenue: result.pendingRevenue
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




const getOrderStatsOverMonth = async (req, res) => {
  const orgid=req.body.orgid
  try {
const now = new Date();

// 📅 Start of current month
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

// 📅 End = today
const today = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate()
);

// 🔁 Format to dd/mm/yyyy
const formatDate = (date) =>
  String(date.getDate()).padStart(2, "0") + "/" +
  String(date.getMonth() + 1).padStart(2, "0") + "/" +
  date.getFullYear();

const startDate = formatDate(startOfMonth);
const endDate = formatDate(today);
    if (!startDate) {
      return res.status(400).json({ message: "startDate is required" });
    }

    const start = new Date(startDate.split("/").reverse().join("-"));
    const end = endDate
      ? new Date(endDate.split("/").reverse().join("-"))
      : start;

    const diffDays =
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    /* =========================
       SINGLE DATE
    ========================= */
    if (!endDate || diffDays === 1) {
      const data = await Order.aggregate([
        { $match: { orgid:orgid,date: startDate } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);

      let delivered = 0,
        cancelled = 0,
        pending = 0;

      data.forEach(d => {
        if (d._id === "delivered") delivered = d.count;
        if (d._id === "cancelled") cancelled = d.count;
        if (d._id === "pending") pending = d.count;
      });

      return res.json({
        type: "single-day",
        date: startDate,
        delivered,
        cancelled,
        pending
      });
    }

    /* =========================
       RANGE TYPE
    ========================= */
    let format = "";
    let mode = ""; // day | month | year

    if (diffDays <= 31) {
      format = "%d/%m/%Y";
      mode = "day";
    } else if (diffDays <= 365) {
      format = "%m/%Y";
      mode = "month";
    } else {
      format = "%Y";
      mode = "year";
    }

    /* =========================
       AGGREGATION
    ========================= */
    const raw = await Order.aggregate([
      {
        $addFields: {
          orderDateObj: {
            $dateFromString: {
              dateString: "$date",
              format: "%d/%m/%Y"
            }
          }
        }
      },
      {
        $match: {
          orgid:orgid,
          orderDateObj: { $gte: start, $lte: end },
          status: { $in: ["delivered", "cancelled"] }
        }
      },
      {
        $group: {
          _id: {
            period: {
              $dateToString: { format, date: "$orderDateObj" }
            },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.period",
          delivered: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", "delivered"] }, "$count", 0]
            }
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", "cancelled"] }, "$count", 0]
            }
          }
        }
      }
    ]);

    /* =========================
       GAP FILLING
    ========================= */
    const map = new Map();
    raw.forEach(r => {
      map.set(r._id, {
        delivered: r.delivered,
        cancelled: r.cancelled
      });
    });

    const result = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      let key;

      if (mode === "day") {
        key =
          String(cursor.getDate()).padStart(2, "0") +
          "/" +
          String(cursor.getMonth() + 1).padStart(2, "0") +
          "/" +
          cursor.getFullYear();
        cursor.setDate(cursor.getDate() + 1);
      }

      if (mode === "month") {
        key =
          String(cursor.getMonth() + 1).padStart(2, "0") +
          "/" +
          cursor.getFullYear();
        cursor.setMonth(cursor.getMonth() + 1);
      }

      if (mode === "year") {
        key = String(cursor.getFullYear());
        cursor.setFullYear(cursor.getFullYear() + 1);
      }

      const stats = map.get(key) || { delivered: 0, cancelled: 0 };

      result.push({
        [mode]: key,
        delivered: stats.delivered,
        cancelled: stats.cancelled
      });
    }

    res.json({
      type: `${mode}-wise`,
      startDate,
      endDate,
      stats: result
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getOrderStatsOverCustom = async (req, res) => {
  const orgid=req.body.orgid
  try {


const startDate =req.body.start;
const endDate = req.body.end;
    if (!startDate) {
      return res.status(400).json({ message: "startDate is required" });
    }

    const start = new Date(startDate.split("/").reverse().join("-"));
    const end = endDate
      ? new Date(endDate.split("/").reverse().join("-"))
      : start;

    const diffDays =
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    /* =========================
       SINGLE DATE
    ========================= */
    if (!endDate || diffDays === 1) {
      const data = await Order.aggregate([
        { $match: { orgid:orgid, date: startDate } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);

      let delivered = 0,
        cancelled = 0,
        pending = 0;

      data.forEach(d => {
        if (d._id === "delivered") delivered = d.count;
        if (d._id === "cancelled") cancelled = d.count;
        if (d._id === "pending") pending = d.count;
      });

      return res.json({
        type: "single-day",
        date: startDate,
        delivered,
        cancelled,
        pending
      });
    }

    /* =========================
       RANGE TYPE
    ========================= */
    let format = "";
    let mode = ""; // day | month | year

    if (diffDays <= 31) {
      format = "%d/%m/%Y";
      mode = "day";
    } else if (diffDays <= 365) {
      format = "%m/%Y";
      mode = "month";
    } else {
      format = "%Y";
      mode = "year";
    }

    /* =========================
       AGGREGATION
    ========================= */
    const raw = await Order.aggregate([
      {
        $addFields: {
          orderDateObj: {
            $dateFromString: {
              dateString: "$date",
              format: "%d/%m/%Y"
            }
          }
        }
      },
      {
        $match: {
          orgid:orgid,
          orderDateObj: { $gte: start, $lte: end },
          status: { $in: ["delivered", "cancelled"] }
        }
      },
      {
        $group: {
          _id: {
            period: {
              $dateToString: { format, date: "$orderDateObj" }
            },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.period",
          delivered: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", "delivered"] }, "$count", 0]
            }
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", "cancelled"] }, "$count", 0]
            }
          }
        }
      }
    ]);

    /* =========================
       GAP FILLING
    ========================= */
    const map = new Map();
    raw.forEach(r => {
      map.set(r._id, {
        delivered: r.delivered,
        cancelled: r.cancelled
      });
    });

    const result = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      let key;

      if (mode === "day") {
        key =
          String(cursor.getDate()).padStart(2, "0") +
          "/" +
          String(cursor.getMonth() + 1).padStart(2, "0") +
          "/" +
          cursor.getFullYear();
        cursor.setDate(cursor.getDate() + 1);
      }

      if (mode === "month") {
        key =
          String(cursor.getMonth() + 1).padStart(2, "0") +
          "/" +
          cursor.getFullYear();
        cursor.setMonth(cursor.getMonth() + 1);
      }

      if (mode === "year") {
        key = String(cursor.getFullYear());
        cursor.setFullYear(cursor.getFullYear() + 1);
      }

      const stats = map.get(key) || { delivered: 0, cancelled: 0 };

      result.push({
        key: key,
        orders: stats.delivered,
      });
    }

    res.json({
      type: `${mode}-wise`,
      startDate,
      endDate,
      stats: result
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getRevStatsOverCustom = async (req, res) => {
  const orgid=req.body.orgid
  console.log(req.body)
  try {
    const startDate = req.body.start;
    const endDate = req.body.end;

    if (!startDate) {
      return res.status(400).json({ message: "startDate is required" });
    }

    const start = new Date(startDate.split("/").reverse().join("-"));
    const end = endDate ? new Date(endDate.split("/").reverse().join("-")) : start;

    const diffDays =
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    let format = "";
    let mode = ""; // day | month | year

    // 📌 Decide grouping format based on range
    if (diffDays <= 31) {
      format = "%d/%m/%Y";
      mode = "day";
    } else if (diffDays <= 365) {
      format = "%m/%Y";
      mode = "month";
    } else {
      format = "%Y";
      mode = "year";
    }

    const raw = await Order.aggregate([
      {
        $addFields: {
          orderDateObj: {
            $dateFromString: {
              dateString: "$date",
              format: "%d/%m/%Y"
            }
          },
          amountNum: { $toDouble: "$amount" }
        }
      },
      {
        $match: {
          orgid:orgid,
          orderDateObj: { $gte: start, $lte: end },
          status: "delivered" // 📌 only delivered orders
        }
      },
      {
        $group: {
          _id: {
            period: { $dateToString: { format, date: "$orderDateObj" } }
          },
          revenue: { $sum: "$amountNum" }
        }
      }
    ]);

    // 📌 Fill missing dates / months / years
    const map = new Map();
    raw.forEach((r) => map.set(r._id.period, r.revenue));

    const result = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      let key;

      if (mode === "day") {
        key =
          String(cursor.getDate()).padStart(2, "0") +
          "/" +
          String(cursor.getMonth() + 1).padStart(2, "0") +
          "/" +
          cursor.getFullYear();
        cursor.setDate(cursor.getDate() + 1);
      }

      if (mode === "month") {
        key =
          String(cursor.getMonth() + 1).padStart(2, "0") +
          "/" +
          cursor.getFullYear();
        cursor.setMonth(cursor.getMonth() + 1);
      }

      if (mode === "year") {
        key = cursor.getFullYear().toString();
        cursor.setFullYear(cursor.getFullYear() + 1);
      }

      result.push({
        key: key,
        revenue: map.get(key) || 0
      });
    }

    return res.json({
      type: `${mode}-wise-revenue`,
      startDate,
      endDate,
      stats: result
    });

  } catch (err) {
      console.log(err.message)
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  addOrder,getallOrders,drivergetOrderByDate,
  getOrderByDate,getOrdersByPage,getOrderStats,markOrdersPaid,
  getOrderStatsOverMonth,
  getRevenueStatsOverTime,
  getOrderStatsOverCustom,  getRevStatsOverCustom,

};
