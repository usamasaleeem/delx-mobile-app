
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Transaction = require("../models/Transaction.model");

const Customer = require("../models/Customer.model");
// Register Transaction

const registerTransaction = async (req, res) => {
  try {
    const { to, amount, orgid } = req.body;

    if (!orgid) {
      return res.status(400).json({ message: "orgid is required" });
    }

    if (!to) {
      return res.status(400).json({ message: "Customer ID (to) required" });
    }

    // Find customer by ID + orgid for ownership protection
    const customer = await Customer.findOne({ _id: to, orgid: orgid });
    if (!customer) {
      return res.status(404).json({
        message: "Customer not found or does not belong to this organization"
      });
    }

    // Convert current credits to number safely
    const currentCredits = parseFloat(customer.credits) || 0;
    const addAmount = parseFloat(amount) || 0;

    // Update credits
    customer.credits = (currentCredits + addAmount).toString();
    await customer.save();

    // Save transaction with orgid enforced
    const newTransaction = new Transaction({
      ...req.body,
      orgid: orgid
    });
    await newTransaction.save();

    res.status(201).json({
      message: "Transaction successful",
      customer: customer._id,
      updatedCredits: customer.credits
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

const driverTranaction = async (req, res) => {
  try {
    const { to, amount } = req.body;

    // Find the customer first
    const customer = await Customer.findById(to);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    // Convert current credits to number (handle empty or invalid strings)
    const currentCredits = parseFloat(customer.credits) || 0;
    const addAmount = parseFloat(amount) || 0;

    customer.credits = (currentCredits + addAmount).toString(); // store back as string
    await customer.save();

    // Save the transaction
    const newTransaction = new Transaction({ ...req.body,by:req.body.id });
    await newTransaction.save();

    res.status(201).json({ message: "Transaction successful", newCredits: customer.credits });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};
const getbypage = async (req, res) => {
  console.log(req.body)
  const orgid=req.body.orgid
  try {
    const { page = 1, filter } = req.body;

    const limit = 10;
    const skip = (page - 1) * limit;

    // 🔹 Dynamic match filter
    const matchStage = {orgid:orgid};

    // Filter by driver
    if (filter.driver?._id) {
      matchStage.by = filter.driver._id;
    }

    // Filter by customer
    if (filter.cust?._id) {
      matchStage.to = filter.cust._id;
    }

    // Filter by date (dd/mm/yyyy)
    if (filter?.date) {

      if(filter?.date.type==='single'){
   const [day, month, year] = filter.date.date.split("/");

        const startDate = new Date(year, month - 1, day, 0, 0, 0);
        const endDate = new Date(year, month - 1, day, 23, 59, 59);

        matchStage.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      }
      else{
  const [day, month, year] = filter.date.from.split("/");

  const [day2, month2, year2] = filter.date.to.split("/");

      const startDate = new Date(year, month - 1, day, 0, 0, 0);
      const endDate = new Date(year2, month2 - 1, day2, 23, 59, 59);

      matchStage.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
      }
    
    }

    const pipeline = [
      // 1️⃣ Apply filters only if exists
      Object.keys(matchStage).length > 0 ? { $match: matchStage } : null,

      // 2️⃣ Sort
      { $sort: { createdAt: -1 } },

      // 3️⃣ Customer Lookup
      {
        $lookup: {
          from: "customers",
          let: { customerId: { $toObjectId: "$to" }, org: "$orgid"},
          pipeline: [
            {
              $match: {
                $expr: {
                     $and: [
                    { $eq: ["$_id", "$$customerId"] },
                    { $eq: ["$orgid", "$$org"] } // 🔐 orgid isolation
                  ]
                 }
              }
            },
            { $project: { name: 1, address: 1 } }
          ],
          as: "customer"
        }
      },
      {
        $unwind: {
          path: "$customer",
          preserveNullAndEmptyArrays: true
        }
      },

      // 4️⃣ Driver Lookup
      {
        $lookup: {
          from: "drivers",
          let: { driverId: { $toObjectId: "$by" }, org: "$orgid" },
          pipeline: [
            {
              $match: {
                $expr: {  $and: [
                    { $eq: ["$_id", "$$driverId"] },
                    { $eq: ["$orgid", "$$org"] } // 🔐 orgid isolation
                  ] }
              }
            },
            { $project: { name: 1, imgurl: 1 } }
          ],
          as: "driver"
        }
      },
      {
        $unwind: {
          path: "$driver",
          preserveNullAndEmptyArrays: true
        }
      },

      // 5️⃣ Projection
      {
        $project: {
          amount: 1,
          type: 1,
          createdAt: 1,
          to: 1,
          by: 1,

          custname: "$customer.name",
          custaddress: "$customer.address",

          drivername: "$driver.name",
          driverimg: "$driver.imgurl"
        }
      },

      // 6️⃣ Pagination
      { $skip: skip },
      { $limit: limit }
    ].filter(Boolean); // 👈 removes null match stage

    const [transactions, total] = await Promise.all([
      Transaction.aggregate(pipeline),
      Transaction.countDocuments(matchStage)
    ]);

    res.status(200).json({
      data: transactions,
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


const getTransactionStats = async (req, res) => {
  const orgid=req.body.orgid
  try {
    const { filter } = req.body;

    const matchStage = {orgid:orgid};

    // Filter by driver
    if (filter?.driver?._id) {
      matchStage.by = filter.driver._id;
    }

    // Filter by customer
    if (filter?.cust?._id) {
      matchStage.to = filter.cust._id;
    }

    // Filter by date
    if (filter?.date) {
      if (filter.date.type === "single") {
        const [day, month, year] = filter.date.date.split("/");

        const startDate = new Date(year, month - 1, day, 0, 0, 0);
        const endDate = new Date(year, month - 1, day, 23, 59, 59);

        matchStage.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      } else {
        const [d1, m1, y1] = filter.date.from.split("/");
        const [d2, m2, y2] = filter.date.to.split("/");

        const startDate = new Date(y1, m1 - 1, d1, 0, 0, 0);
        const endDate = new Date(y2, m2 - 1, d2, 23, 59, 59);

        matchStage.createdAt = {
          $gte: startDate,
          $lte: endDate
        };
      }
    }

    const result = await Transaction.aggregate([
      Object.keys(matchStage).length ? { $match: matchStage } : null,
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" }
        }
      }
    ].filter(Boolean));

    res.status(200).json({
      totalAmount: result[0]?.totalAmount || 0
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



module.exports = {
  registerTransaction,getbypage,
  driverTranaction,
  getTransactionStats
};
