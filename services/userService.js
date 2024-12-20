const bcrypt = require('bcrypt');
const transportersService = require("../services/transportersService");
const suppliersService = require("../services/suppliersService");
const manufacturersService = require("../services/manufacturersService");
const distributorsService = require("../services/distributorsService");
const retailersService = require("../services/retailersService");
const { createToken } = require('../services/authService');
const { getModelByUserType } = require("../models/userModel");
const asyncHandler = require('express-async-handler')


// Login method
async function login(req, res) {
  const { email, password, userType } = req.body;

  try {
    const UserModel = getModelByUserType(userType);

    // Find the user in the database
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No user found with this email and user type.' });
    }

    // When checking the password during login
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect password or email.' });
    }

    // Create a JWT token
    const token = createToken(user._id, userType);

    res.cookie('token', token, {
      httpOnly: true,       // Makes the cookie unreadable by the client.
      secure: true,         // Cookies are only sent over HTTPS.
      sameSite: 'Strict',   // Protects against CSRF attacks
      maxAge: 7200000       // cookie shelf life
    });

    // Return additional information with success response.
    return res.status(200).json({
      message: 'Login successful',
      userId: user._id,
      userRole: userType
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
}

// Register method
async function register(req, res) {
  const { userType } = req.body;
  const { category } = req.body;

  try {
    let result;
    switch (userType) {
      case "transporter":
        result = await transportersService.registerTransporter(req.body);
        break;
      case "supplier":
        result = await suppliersService.registerSupplier(req.body);
        break;
      case "manufacturer":
        result = await manufacturersService.registerManufacturer(req.body);
        break;
      case "distributor":
        result = await distributorsService.registerDistributor(req.body);
        break;
      case "retailer":
        result = await retailersService.registerRetailer(req.body);
        break;
      default:
        return res.status(400).json({ error: "Invalid user type." });
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


const getOne = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { userType } = req.query;

  try {
    const UserModel = getModelByUserType(userType);
    const document = await UserModel.findById(id);

    if (!document) {
      return res.status(404).json({ error: "No document found for this id." });
    }

    res.status(200).json({ data: document });
  } catch (error) {
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});


// bring all the supplier list in the view page 
const getOneWithSupplier = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { userType } = req.query;

  try {
    const UserModel = getModelByUserType(userType);

    const document = await UserModel.findById(id).populate('suppliersList');

    if (!document) {
      return res.status(404).json({ error: "No document found for this id." });
    }

    res.status(200).json({ data: document });
  } catch (error) {
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});


// bring all the Manufacturer list in the view page 
const getOneWithManufacturer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { userType } = req.query;

  try {
    const UserModel = getModelByUserType(userType);

    const document = await UserModel.findById(id).populate('manufacturersList');

    if (!document) {
      return res.status(404).json({ error: "No document found for this id." });
    }

    res.status(200).json({ data: document });
  } catch (error) {
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// bring all the Distributor list in the view page 
const getMeWithDistributor = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { userType } = req.query;

  try {
    const UserModel = getModelByUserType(userType);

    const document = await UserModel.findById(id).populate('distributorsList');

    if (!document) {
      return res.status(404).json({ error: "No document found for this id." });
    }

    res.status(200).json({ data: document });
  } catch (error) {
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

const getLoggedUserData = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  req.query.userType = req.user.userType;
  next();
});

// Update User method
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userType } = req.query;

  try {
    const UserModel = getModelByUserType(userType);

    const updateData = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: `${userType} updated successfully.`, data: updatedUser });

  } catch (error) {
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

module.exports = {
  login,
  register,
  getOne,
  getLoggedUserData,
  updateUser,
  getOneWithSupplier,
  getOneWithManufacturer,
  getMeWithDistributor
};