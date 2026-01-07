const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true
    },
    orgid: {
      type: String,
      required: true
    },
    to: {
      type: String,
      required: true
    },
    by: {
      type: String,
    },
    modeofpayment: {
      type: String,
    },
    type: {
      type: String
    },
  },
  { timestamps: true }
);

// create geospatial index (optional but useful)

module.exports = mongoose.model("transaction", transactionSchema);
