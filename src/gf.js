// addOrgIdToAll.js
import mongoose from "mongoose";
import dotenv from "dotenv"; 

dotenv.config();

// ⚠️ CHANGE THIS to the orgid you want to insert
const ORG_ID = "6941494bc13dc812fc6e1495";

// 🔗 Connect to MongoDB
await mongoose.connect("mongodb+srv://scrapiozilla:8fkri65FYyNlnN0e@cluster0.1wzth.mongodb.net/?ssl=true&replicaSet=atlas-mtx3jm-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

console.log("Connected to DB");

// 📌 Import all your models
import Customer from "./models/Customer.model.js";
import Driver from "./models/Driver.model.js";
import Vehicle from "./models/Vehicle.model.js";
import Product from "./models/Product.model.js";
import Order from "./models/Order.model.js";
import Schedule from "./models/Schedule.model.js";
import Shift from "./models/Shift.model.js";
import Transaction from "./models/Transaction.model.js";
import Comp from "./models/Comp.model.js";

// 📌 Array of models to loop for update
const models = [
  Customer,
  Driver,
  Vehicle,
  Product,
  Order,
  Schedule,
  Shift,
  Transaction,
  Comp,
];

async function addOrgId() {
  for (const model of models) {
    const res = await model.updateMany(
      { },                          // match all docs
      { $set: { orgid: ORG_ID } }   // insert or update orgid
    );

    console.log(`${model.modelName}: Updated ${res.modifiedCount} documents`);
  }

  mongoose.connection.close();
  console.log("Done! All documents updated with orgid.");
}

addOrgId();
