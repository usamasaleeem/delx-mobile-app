const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  
  vehicletype: {
    type: String,
    required: true
  },
    orgid: {
    type: String,
    required: true
  },
  no: {
    type: String,
    required: true
  },
  model: {
    type: String,
  },
   capacity: {
    type: String,
  },
   status: {
    type: String,
  },
  
 
}, { timestamps: true });

module.exports = mongoose.model("vehicle", vehicleSchema);
