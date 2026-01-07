const mongoose = require("mongoose");

const CompSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    logo: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },

    curr:{
 type: String,
      required: true
    },
     email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    }},
  { timestamps: true }
);

module.exports = mongoose.model("comp", CompSchema);
