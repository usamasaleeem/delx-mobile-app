const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({

  driverid: {
    type: String,
    required: true
  },
   route: {
    type: String,
    required: true
  },

  vehicleid: {
    type: String,
    required: true
  },

  // 🔥 Frequency: once OR multiple
  frequency: {
    type: String,
    required: true
  },

  // 🔥 If frequency = once
  date: {
    type: String, // or Date
  },

    area: {
    type: String, // or Date
  },
    orgid: {
    type: String, // or Date
          required: true
  },

  // 🔥 If frequency = multiple (selected days)
  days: {
    type: [String], // ["Monday", "Wednesday", "Friday"]
    default: []
  },

  // 🔥 Customers in sequence for this route/schedule
  customers: [
    {
      customerid: { type: String, required: true },
      sequence: { type: Number, required: true },
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("schedule", scheduleSchema);
