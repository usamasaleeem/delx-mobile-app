const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  
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
   pass: {
    type: String,
    required: true
  },
  imgurl: {
    type: String,
  },
  cnic: {
    type: String,
  },
  lisc: {
    type: String,
  },
   address: {
    type: String,
  },
   status: {
    type: String,
  },
   paymode: {
    type: String,
  },
   pay: {
    type: String,
  },
 
}, { timestamps: true });

module.exports = mongoose.model("driver", driverSchema);
