const RetailerModel = require("../models/retailersModel");
const { createToken } = require('../services/authService');
const bcrypt = require("bcryptjs");

const registerRetailer = async (data) => {
  const { full_name, email, phone_number, password, userType } = data;

  const existingRetailer = await RetailerModel.findOne({ email });
  if (existingRetailer) {
    throw new Error("This email is already registered.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newRetailer = new RetailerModel({
    full_name,
    email,
    phone_number,
    password: hashedPassword,
    userType
  });

  try {
    // Attempt to save the new retailer
    await newRetailer.save();

    // Create JWT token
    const token = createToken(newRetailer._id, 'retailer');

    // Check if token creation was successful
    if (!token) {
      throw new Error("Failed to create token. Registration aborted.");
    }

    return { message: "Retailer registered successfully!", newRetailer, token };
  } catch (error) {
    // If there's an error, delete the retailer from the database
    await RetailerModel.deleteOne({ _id: newRetailer._id });
    throw new Error(`Registration failed: ${error.message}`);
  }
};



module.exports = {
  registerRetailer,
};