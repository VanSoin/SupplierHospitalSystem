const mongoose = require('mongoose');

// Request sub-schema for hospital requests
const RequestSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  equipmentName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent', 'critical'],
    default: 'normal'
  },
  dateRequested: {
    type: Date,
    default: Date.now
  }
});


// Main Hospital Schema
const HospitalSchema = new mongoose.Schema({
  // Authentication fields
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
  hospitalName: {
    type: String,
    default: ''
  },
  hospitalAddress: {
    type: String,
    default: ''
  },
  
  // Location (optional - for future matching feature)
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
  
  // Profile completion status
  profileComplete: {
    type: Boolean,
    default: false
  },
  
  // Equipment requests array
  requests: [RequestSchema],
  
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
HospitalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Hospital', HospitalSchema);
