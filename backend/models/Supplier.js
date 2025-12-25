const mongoose = require('mongoose');

// Item sub-schema for better structure
const ItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
});

// Main Supplier Schema
const SupplierSchema = new mongoose.Schema({
  // Authentication fields (NEW)
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  
  // Profile fields
  name: {
    type: String,
    default: ''
  },
  shopName: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  contactNumber: {
    type: String,
    default: ''
  },
  
  // Location (keeping your existing structure)
  location: {
    lat: {
      type: Number,
      default: 0
    },
    lng: {
      type: Number,
      default: 0
    }
  },
  
  // Profile completion status (NEW)
  profileComplete: {
    type: Boolean,
    default: false
  },
  
  // Items array (updated structure)
  items: [ItemSchema],
  
  // Rating (keeping your existing field)
  rating: {
    type: Number,
    default: 5,
    min: 0,
    max: 5
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
SupplierSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Supplier', SupplierSchema);