const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Hospital = require('../models/Hospital');

// Middleware to verify token
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.hospitalId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if hospital exists
    let hospital = await Hospital.findOne({ email });
    if (hospital) {
      return res.status(400).json({ message: 'Hospital already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create hospital
    hospital = new Hospital({
      email,
      password: hashedPassword,
      profileComplete: false
    });

    await hospital.save();

    // Create token
    const token = jwt.sign(
      { id: hospital._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      hospital: {
        _id: hospital._id,
        email: hospital.email,
        profileComplete: hospital.profileComplete
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if hospital exists
    const hospital = await Hospital.findOne({ email });
    if (!hospital) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, hospital.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: hospital._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      hospital: {
        _id: hospital._id,
        email: hospital.email,
        profileComplete: hospital.profileComplete,
        hospitalName: hospital.hospitalName
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.hospitalId).select('-password');
    res.json(hospital);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Profile
router.post('/profile', authMiddleware, async (req, res) => {
  try {
    const { hospitalName, hospitalAddress, location } = req.body;

    const hospital = await Hospital.findByIdAndUpdate(
      req.hospitalId,
      {
        hospitalName,
        hospitalAddress,
        location: location || { lat: 0, lng: 0 },
        profileComplete: true
      },
      { new: true }
    ).select('-password');

    res.json(hospital);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit Equipment Request
router.post('/requests', authMiddleware, async (req, res) => {
  try {
    const { equipmentName, quantity, urgency } = req.body;

    const hospital = await Hospital.findById(req.hospitalId);
    
    if (!hospital.profileComplete) {
      return res.status(400).json({ message: 'Please complete your profile first' });
    }

    const newRequest = {
      equipmentName,
      quantity,
      urgency,
      status: 'pending',
      dateRequested: new Date()
    };

    hospital.requests.push(newRequest);
    await hospital.save();

    res.status(201).json(newRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all requests for hospital
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.hospitalId);
    res.json(hospital.requests || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Delete Request
router.delete('/requests/:index', authMiddleware, async (req, res) => {
  try {
    const requestIndex = parseInt(req.params.index);
    const hospital = await Hospital.findById(req.hospitalId);
    
    if (!hospital.requests || requestIndex >= hospital.requests.length) {
      return res.status(404).json({ message: 'Request not found' });
    }

    hospital.requests.splice(requestIndex, 1);
    await hospital.save();

    res.json({ message: 'Request deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Request
router.put('/requests/:index', authMiddleware, async (req, res) => {
  try {
    const requestIndex = parseInt(req.params.index);
    const { equipmentName, quantity, urgency } = req.body;
    
    const hospital = await Hospital.findById(req.hospitalId);
    
    if (!hospital.requests || requestIndex >= hospital.requests.length) {
      return res.status(404).json({ message: 'Request not found' });
    }

    hospital.requests[requestIndex] = {
      equipmentName,
      quantity,
      urgency,
      status: hospital.requests[requestIndex].status,
      dateRequested: hospital.requests[requestIndex].dateRequested
    };

    await hospital.save();

    res.json(hospital.requests[requestIndex]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Get all suppliers (for hospitals to view)
router.get('/view-suppliers', authMiddleware, async (req, res) => {
  try {
    const Supplier = require('../models/Supplier');
    
    // Get all suppliers with complete profiles
    const suppliers = await Supplier.find({
      profileComplete: true
    }).select('-password'); // Don't send passwords
    
    res.json(suppliers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;