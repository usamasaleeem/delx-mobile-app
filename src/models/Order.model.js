const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  
  custid: {
    type: String,
    required: true
  },
    orgid: {
    type: String,
    required: true
  },
   custname: {
    type: String,
  },
  routeid: {
    
    type: String,
    required: true
  },
    vehicleid: {
    
    type: String,
    required: true
  },
    comment: {
    
    type: String,
  },
  paymentmode: {
    
    type: String,
  },
   shiftid: {
    type: String,
    required: true
  },
  del_add: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
  },
 
driverid: {
    type: String,
  },
 amount: {
    type: String,
  },
   status: {
    type: String,
  },
   paymentstatus: {
    type: String,
  },
   
 
    orderdetails: [
      {
        product: { type: String, required: true },
         name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        total: { type: Number, required: true } // qty * price
      }
    ]






}, { timestamps: true });

module.exports = mongoose.model("order", orderSchema);
