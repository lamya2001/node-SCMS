const mongoose = require('mongoose'); //import mongoose 
const { customAlphabet } = require('nanoid');
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 8);

const ManageRawMaterialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  version: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    required: true,
    minlength: [10, "Description must be at least 10 characters long"],
    trim: true,
  },
  storageInfo: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    trim: true,
  },
  image: {
    type: String, // if using GridFS for image storage change this to an ObjectID  
  },
  shortId: {
    type: String,
    unique: true,
    default: () => nanoid(),
    immutable: true,
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Suppliers',
    required: false, // need to set it to false until Supplier collection is created . Otherwise, error
  },
  materialOption: [{
    optionName: {
      type: String,
    },
    menuList: {
      type: [String],
      default: [],
    },
  }],

  units: {
    type: [String],
    required: true,
    trim: true
  }
}, { timestamps: true });

//2- create model
module.exports = mongoose.model('Manage-Raw-Materials', ManageRawMaterialSchema);
