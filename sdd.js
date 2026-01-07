const getCustomersByPage = async (req, res) => {
  console.log(req.body)
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
    const filteredCustomers = customers.filter(c => pendingMap[c._id.toString()] > 0);

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
        total: customersWithLastTrans.length,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};