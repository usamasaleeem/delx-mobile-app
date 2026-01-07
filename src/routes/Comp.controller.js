
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Comp = require("../models/Comp.model");
const { generateToken } = require("../utils/token");

// Register Comp
const registerComp = async (req, res) => {
  try {

    const hashedPassword = await bcrypt.hash("1234", 10);
    const newComp = new Comp({
      name: "ABC Water Delivery",
      logo: "https://firebasestorage.googleapis.com/v0/b/lawyers-806e6.appspot.com/o/images%2FScreenshot%202025-11-17%20at%206.32.13%E2%80%AFPM.png?alt=media&token=37c26651-5429-4381-aada-e9b4375c80cf",
      phone: "03001234567",
      email: "admin@abc.com",
      password: hashedPassword // ⚠️ hash in real apps
    });

    await newComp.save();

    res.status(201).json({
      message: "Account created successfully",
      company: newComp
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "Lax"
  });
  return res.json({ message: "Logged out" });
}

const loginComp = async (req, res) => {
  console.log(req.body)
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const comp = await Comp.findOne({ email });
    if (!comp) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, comp.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = generateToken({ id: comp._id, email: comp.email });

    // Send token in cookie (HttpOnly, secure)
    res.cookie("token", token, {
      httpOnly: true,       // ❗not accessible by JS (more secure)
      secure: false,        // set true in production with HTTPS
      sameSite: "Lax",      // lax or strict for better CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days login
    });

    // Send response (no token returned in body)
    return res.status(200).json({
      message: "Login successful",
      company: {
        id: comp._id,
        name: comp.name,
        email: comp.email,
        phone: comp.phone,
        logo: comp.logo
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};
const checkAuth = async (req, res) => {
  try {
     return res.status(200).json({
      auth: true,
     
    });
  } catch (err) {
    console.log(err)
    return res.status(401).json({ auth: false, message: "Invalid or expired token" });
  }
};



const getAllComps = async (req, res) => {
  try {
    const Comps = await Comp.find().sort({ createdAt: -1 }); // newest first
    res.status(200).json(Comps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getCompsByPage = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [Comps, total] = await Promise.all([
      Comp.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Comp.countDocuments()
    ]);

    res.status(200).json({
      data: Comps,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




module.exports = {
  registerComp,getAllComps,checkAuth,
  getCompsByPage,loginComp,logout
};
