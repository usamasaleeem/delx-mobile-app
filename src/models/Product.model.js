const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  
  product: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
    orgid: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
    deposit: {
    type: Number,
    required: true
  },
  status: {
    type: String,
  },
 
}, { timestamps: true });

module.exports = mongoose.model("product", productSchema);
