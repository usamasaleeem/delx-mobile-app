const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
      orgid: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    billdue: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    credits: {
      type: String,
    },
     type: {
      type: String,
    },
    securitydeposit: {
      type: String
    },
    status: {
      type: String
    },
    address: {
      type: String
    },

    // Coordinates: [lng, lat]
    location: {
      type: [Number], // [lng, lat]
      required: false
    },

    // Schedule for all days
    schedule: {
      Monday: [
        {
          productid: { type: String },
          qty: { type: Number },
          time: { type: String } // e.g. "12:00"
        }
      ],
      Tuesday: [
        {
          productid: { type: String },
          qty: { type: Number },
          time: { type: String }
        }
      ],
      Wednesday: [
        {
          productid: { type: String },
          qty: { type: Number },
          time: { type: String }
        }
      ],
      Thursday: [
        {
          productid: { type: String },
          qty: { type: Number },
          time: { type: String }
        }
      ],
      Friday: [
        {
          productid: { type: String },
          qty: { type: Number },
          time: { type: String }
        }
      ],
      Saturday: [
        {
          productid: { type: String },
          qty: { type: Number },
          time: { type: String }
        }
      ],
      Sunday: [
        {
          productid: { type: String },
          qty: { type: Number },
          time: { type: String }
        }
      ]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("customer", customerSchema);
