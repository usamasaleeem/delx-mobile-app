
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Shift = require("../models/Shift.model");
const { getFormattedDateTime } = require("../utils/util");
// Register Shift


const startShift = async (req, res) => {
  console.log(req.body);
  const { date, time } = getFormattedDateTime();
  
  try {
    const newShift = new Shift({
      ...req.body,
      driverid: req.body.id,
      start: time,
      date: date,
      end: "-",
      status: "active"
    });

    const savedShift = await newShift.save();

    // 👉 Return the newly created shift object to frontend
    return res.status(201).json({
      success: true,
      message: "Shift started successfully",
      shift: savedShift
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
const endShift = async (req, res) => {
  try {
    const { shiftid } = req.body; // shift id from frontend
    const {date, time } = getFormattedDateTime(); // get current time

    if (!shiftid) {
      return res.status(400).json({ success: false, message: "Shift ID is required" });
    }

    // 👉 Find the shift and update
    const updatedShift = await Shift.findOneAndUpdate(
      {_id:shiftid,orgid:req.body.orgid},
      { end: time, status: "completed" },
      { new: true } // return updated object
    );

    if (!updatedShift) {
      console.log('not fouond')
      return res.status(404).json({ success: false, message: "Shift not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Shift ended successfully",
      shift: updatedShift
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


const getallShifts = async (req, res) => {
  try {
    const Shifts = await Shift.find().sort({ createdAt: -1 }); // newest first
    res.status(200).json(Shifts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getShiftsByDate = async (req, res) => {
  const orgid=req.body.orgid;
  try {
    const Shifts = await Shift.find({date:req.body.date,orgid:orgid}).sort({ createdAt: -1 }); // newest first
    res.status(200).json(Shifts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getActiveShift = async (req, res) => {
  const { date } = getFormattedDateTime(); // we only need today's date

  try {
    const driverId = req.body.id;
       const orgid = req.body.orgid;
    if (!driverId) {
      return res.status(400).json({ success: false, message: "Driver ID required" });
    }

    // 👉 Active shift (still running)
    const activeShift = await Shift.findOne({
      driverid: driverId,
      orgid:orgid,
      end: "-",
      date: date
    }).sort({ createdAt: -1 });

    // 👉 All shifts of today for the driver
    const todayShifts = await Shift.find({
      driverid: driverId,
      date: date,
           orgid:orgid,
      end:{ $ne: "-" },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      shift:activeShift,   // current ongoing shift or null
      oshifts:todayShifts    // all today's shifts
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};



module.exports = {
  startShift,getallShifts,getShiftsByDate,getActiveShift,
  endShift
};
