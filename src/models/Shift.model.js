const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  
  routeid: {
    type: String,
    required: true
  },
    orgid: {
    type: String,
    required: true
  },
  vehicleid: {
    type: String,
    required: true
  },
  driverid: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  start: {
    type: String,
    required: true
  },
  end: {
    type: String,
  },
  kms: {
    type: String,
  },
    orders: {
    type: [String],
  },
   status: {
    type: String,
  },
   
 
    orderdetails: [
      {
        product: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        total: { type: Number, required: true } // qty * price
      }
    ]






}, { timestamps: true });

module.exports = mongoose.model("shift", shiftSchema);
