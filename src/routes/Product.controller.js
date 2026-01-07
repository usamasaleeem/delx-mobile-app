
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Product = require("../models/Product.model");
// Register Product
const addproduct = async (req, res) => {
  try {
 

  

    const newProduct = new Product({...req.body,status:"active"});

    await newProduct.save();
    res.status(201).json({ message: "Account created successfully. Status: pending" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const deleteProduct = async (req, res) => {
  const { activeid, orgid } = req.body;

  try {
    const deleted = await Product.findOneAndDelete({ _id: activeid, orgid });

    if (!deleted) {
      return res.status(404).json({ message: "Product not found or orgid mismatch" });
    }

    res.status(200).json({ message: "Product deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const updateProduct = async (req, res) => {
  try {
    const { activeid, ...data } = req.body; // id + all other fields

    if (!activeid) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      activeid,
      data,                // all fields sent from frontend will update
      { new: true }        // return updated record
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product updated successfully",
      Product: updatedProduct
    });

  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};

const getallproducts = async (req, res) => {
  try {
    const Products = await Product.find({orgid:req.body.orgid}).sort({ createdAt: -1 }); // newest first
    res.status(200).json(Products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getbyids = async (req, res) => {
  try {
    const { ids } = req.body; // array of ids from frontend

    const products = await Product.find({
      _id: { $in: ids }
    }).sort({ createdAt: -1 });

    res.status(200).json(products);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getProductsByPage = async (req, res) => {
  try {
    const orgid=req.body.orgid
    const page = parseInt(req.body.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [Products, total] = await Promise.all([
      Product.find({orgid:orgid})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments({orgid:orgid})
    ]);

    res.status(200).json({
      data: Products,
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
  deleteProduct,addproduct,getallproducts,getbyids,getProductsByPage,updateProduct
};
