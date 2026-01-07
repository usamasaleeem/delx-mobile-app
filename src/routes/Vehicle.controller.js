
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Vehicle = require("../models/Vehicle.model");
// Register Vehicle
const registerVehicle = async (req, res) => {
  try {
 

  

    const newVehicle = new Vehicle({...req.body,status:'active'});

    await newVehicle.save();
    res.status(201).json({ message: "Account created successfully. Status: pending" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const deleteVehicle = async (req, res) => {
  const { activeid, orgid } = req.body;

  try {
    const deleted = await Vehicle.findOneAndDelete({ _id: activeid, orgid });

    if (!deleted) {
      return res.status(404).json({ message: "Vehicle not found or orgid mismatch" });
    }

    res.status(200).json({ message: "Vehicle deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { activeid, ...data } = req.body; // id + all other fields

    if (!activeid) {
      return res.status(400).json({ message: "Vehicle ID is required" });
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      activeid,
      data,                // all fields sent from frontend will update
      { new: true }        // return updated record
    );

    if (!updatedVehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    return res.status(200).json({
      message: "Vehicle updated successfully",
      Vehicle: updatedVehicle
    });

  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};



const getAllVehicles = async (req, res) => {
    const orgid=req.body.orgid
  try {
    const Vehicles = await Vehicle.find({orgid}).sort({ createdAt: -1 }); // newest first
    res.status(200).json(Vehicles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getVehiclesByPage = async (req, res) => {
  const { orgid } = req.body;

  try {
    const page = parseInt(req.body.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [Vehicles, total, allForCapacity] = await Promise.all([
      Vehicle.find({ orgid })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Vehicle.countDocuments({ orgid }),
      Vehicle.find({ orgid }) 
    ]);

    // sum capacity but ignore invalid / non-numeric
    const totalCapacity = allForCapacity.reduce((sum, v) => {
      const cap = Number(String(v.capacity).replace(/,/g, ""));
      return (!isNaN(cap) && cap > 0) ? sum + cap : sum;
    }, 0);

    res.status(200).json({
      data: Vehicles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalCapacity
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




module.exports = {
 deleteVehicle, registerVehicle,getAllVehicles,getVehiclesByPage,updateVehicle
};
