
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer.model");
const Driver = require("../models/Driver.model");
const Vehicle = require("../models/Vehicle.model");
const Product = require("../models/Product.model");
const Order = require("../models/Order.model");
const Transaction = require("../models/Transaction.model");
// Register Customer
const registerCustomer = async (req, res) => {
  try {
 

  

    const newCustomer = new Customer({...req.body,credits:0});

    await newCustomer.save();
    res.status(201).json({ message: "Account created successfully. Status: pending" });
  } catch (err) {
    console.log(err.message)
    res.status(500).json({ message: err.message });
  }
};
const overviewCustomers = async (req, res) => {
  try {
        const orgid = req.body.orgid;
    const today = new Date().getDate(); // today's day number (1-31)

    // 1️⃣ Get customers based on billdue (string comparison fixed)
    const customers = await Customer.find({
       orgid: orgid,
      $expr: {
        $and: [
          { $gte: [{ $toInt: "$billdue" }, 1] },
          { $lt: [{ $toInt: "$billdue" }, today] }
        ]
      }
    });

    const customerIds = customers.map(c => c._id.toString());

    // 2️⃣ Find only customers who have pending balance
    const pendingOrders = await Order.aggregate([
      {
        $match: {
           orgid: orgid,
          custid: { $in: customerIds },
          status: "delivered",
          paymentstatus: "pending"
        }
      },
      {
        $group: {
          _id: "$custid",
          pendingAmount: { $sum: { $toDouble: "$amount" } }
        }
      }
    ]);

    // Extract only those customer IDs with pending balance
    const pendingCustomerIds = pendingOrders.map(p => p._id);

    const totalPending = pendingOrders.reduce((sum, o) => sum + o.pendingAmount, 0);

    res.status(200).json({
      count: pendingCustomerIds.length, // only customers having balance
      ids: pendingCustomerIds,          // only customers with pending balance
      totalPending                      // combined pending amount
    });

  } catch (err) {
    console.log(err.message)
    res.status(500).json({ message: err.message });
  }
};

const deleteCustomer = async (req, res) => {
  const { activeid, orgid } = req.body;

  try {
    const deleted = await Customer.findOneAndDelete({ _id: activeid, orgid });

    if (!deleted) {
      return res.status(404).json({ message: "Customer not found or orgid mismatch" });
    }

    res.status(200).json({ message: "Customer deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { activeid, ...data } = req.body; // id + all other fields

    if (!activeid) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      activeid,
      data,                // all fields sent from frontend will update
      { new: true }        // return updated record
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({
      message: "Customer updated successfully",
      customer: updatedCustomer
    });

  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};


const getAllCustomers = async (req, res) => {
  const orgid=req.body.orgid
  try {
    const customers = await Customer.find({orgid}).sort({ createdAt: -1 }); // newest first
    res.status(200).json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
function getNextDueDate(lastDate, billdue) {
  if (!billdue) return null;

  const dueDay = parseInt(billdue);
  const today = new Date();

  // 🟢 Case 1: NO last transaction date
  if (!lastDate) {
    let thisMonthDue = new Date(today.getFullYear(), today.getMonth(), dueDay);

    // If today's date is before dueDay → due date is this month
    if (today.getDate() <= dueDay) {
      return thisMonthDue;
    }

    // If billdue day already passed → next month
    return new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
  }

  // 🟢 Case 2: Last transaction exists → always next month
  const d = new Date(lastDate);
  return new Date(d.getFullYear(), d.getMonth() + 1, dueDay);
}



const getCustomersByPage = async (req, res) => {
  try {
    const orgid = req.body.orgid;
    const page = parseInt(req.body.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // 1️⃣ Fetch customers
    const [customers, total] = await Promise.all([
      Customer.find({ orgid })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Customer.countDocuments({ orgid })
    ]);

    // 2️⃣ Extract customer IDs
    const customerIds = customers.map(c => c._id.toString());

    // 3️⃣ Find pending due/balance from orders
    const pendingOrders = await Order.aggregate([
      {
        $match: {
          custid: { $in: customerIds },
          status: "delivered",
          paymentstatus: "pending"
        }
      },
      {
        $group: {
          _id: "$custid",
          pendingRevenue: { $sum: { $toDouble: "$amount" } }
        }
      }
    ]);

    // Create lookup map
    const pendingMap = {};
    pendingOrders.forEach(p => {
      pendingMap[p._id] = p.pendingRevenue;
    });


    // 4️⃣ Filter only customers who have balance
    const filteredCustomers = customers;

    // 5️⃣ For each customer → find last transaction
  const customersWithLastTrans = await Promise.all(
  filteredCustomers.map(async (cust) => {
    const lastTransaction = await Transaction.findOne({
      to: cust._id.toString(),
      orgid,
    }).sort({ createdAt: -1 });

    const lastTransactionDate = lastTransaction?.createdAt || null;
    const billdue = cust.billdue; // make sure customer has billdue field
    const nextDueDate = lastTransactionDate ? getNextDueDate(lastTransactionDate, billdue) : getNextDueDate(null, billdue);

    return {
      ...cust.toObject(),
      balance: pendingMap[cust._id.toString()] || 0,
      lastTransactionDate,
      nextDueDate
    };
  })
);


    // 6️⃣ Response
    res.status(200).json({
      data: customersWithLastTrans,
      pagination: {
        total: total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




const getAllStats = async (req, res) => {
  try {
    const orgid = req.body.orgid; 
    const [data1, data2,data3,data4] = await Promise.all([
  
      Customer.countDocuments({orgid}),
      Driver.countDocuments({orgid}),
       Vehicle.countDocuments({orgid}),
       Product.countDocuments({orgid}),

    ]);

    res.status(200).json({
      data: {
        data1:data1,
            data2:data2,
                data3:data3,
                    data4:data4,
      },
     
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
  

const getCustomerStats = async (req, res) => {
  console.log(req.body)
  try {
    let start = req.body.start;
    let end = req.body.end;
      const orgid = req.body.orgid;

    // Handle input
    if (!start) {
      const today = new Date();
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
      const [ds, ms, ys] = start.split("/");
      start = new Date(ys, ms - 1, ds);
    }

    if (!end) {
      end = new Date();
    } else {
      const [de, me, ye] = end.split("/");
      end = new Date(ye, me - 1, de, 23, 59, 59);
    }

    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Setup group format based on range
    let format, mode;

    if (diffDays <= 31) {
      format = "%d/%m/%Y"; // Daily
      mode = "day";
    } else if (diffDays <= 365) {
      format = "%b %Y"; // Monthly
      mode = "month";
    } else {
      format = "%Y"; // Yearly
      mode = "year";
    }

    // Get new customers count by period
    const result = await Customer.aggregate([
      {
        $match: {
            orgid: orgid, 
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format, date: "$createdAt" } },
          newCount: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const mapped = new Map(result.map(v => [v._id, v.newCount]));
    const timeline = [];
    let runningTotal = 0;

    let cursor = new Date(start);

    while (cursor <= end) {
      let key;

      if (mode === "day") {
        key = cursor.toLocaleDateString("en-GB"); // dd/mm/yyyy
        cursor.setDate(cursor.getDate() + 1);
      }

      if (mode === "month") {
        key = cursor.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        cursor.setMonth(cursor.getMonth() + 1);
      }

      if (mode === "year") {
        key = String(cursor.getFullYear());
        cursor.setFullYear(cursor.getFullYear() + 1);
      }

      const newCustomers = mapped.get(key) || 0;
      runningTotal += newCustomers;

      timeline.push({
        key: key,
        customer: runningTotal
      });
    }

    return res.status(200).json({
      success: true,
    
     stats: timeline
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};



module.exports = {
  deleteCustomer,
  registerCustomer,getAllCustomers,
  getCustomersByPage,
  getAllStats,getCustomerStats,overviewCustomers,
  updateCustomer
};
