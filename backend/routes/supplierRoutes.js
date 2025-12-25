const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// You'll need to create these models
const Supplier = require('../models/Supplier');

// Middleware to verify token
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.supplierId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if supplier exists
    let supplier = await Supplier.findOne({ email });
    if (supplier) {
      return res.status(400).json({ message: 'Supplier already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create supplier
    supplier = new Supplier({
      email,
      password: hashedPassword,
      profileComplete: false
    });

    await supplier.save();

    // Create token
    const token = jwt.sign(
      { id: supplier._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      supplier: {
        _id: supplier._id,
        email: supplier.email,
        profileComplete: supplier.profileComplete
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

    // Check if supplier exists
    const supplier = await Supplier.findOne({ email });
    if (!supplier) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, supplier.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: supplier._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      supplier: {
        _id: supplier._id,
        email: supplier.email,
        profileComplete: supplier.profileComplete,
        name: supplier.name,
        shopName: supplier.shopName
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
    const supplier = await Supplier.findById(req.supplierId).select('-password');
    res.json(supplier);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Profile
router.post('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, shopName, address, contactNumber, location, rating } = req.body;

    const supplier = await Supplier.findByIdAndUpdate(
      req.supplierId,
      {
        name,
        shopName,
        address,
        contactNumber,
        location: location || { lat: 0, lng: 0 },
        rating: rating || 5,
        profileComplete: true
      },
      { new: true }
    ).select('-password');

    res.json(supplier);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add Item
router.post('/items', authMiddleware, async (req, res) => {
  try {
    const { itemName, category, price, quantity, description } = req.body;

    const supplier = await Supplier.findById(req.supplierId);
    
    if (!supplier.profileComplete) {
      return res.status(400).json({ message: 'Please complete your profile first' });
    }

    const newItem = {
      itemName,
      category,
      price,
      quantity,
      description,
      dateAdded: new Date()
    };

    supplier.items.push(newItem);
    await supplier.save();

    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all items for supplier
router.get('/items', authMiddleware, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.supplierId);
    res.json(supplier.items || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Delete Item
router.delete('/items/:index', authMiddleware, async (req, res) => {
  try {
    const itemIndex = parseInt(req.params.index);
    const supplier = await Supplier.findById(req.supplierId);
    
    if (!supplier.items || itemIndex >= supplier.items.length) {
      return res.status(404).json({ message: 'Item not found' });
    }

    supplier.items.splice(itemIndex, 1);
    await supplier.save();

    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Item
router.put('/items/:index', authMiddleware, async (req, res) => {
  try {
    const itemIndex = parseInt(req.params.index);
    const { itemName, category, price, quantity, description } = req.body;
    
    const supplier = await Supplier.findById(req.supplierId);
    
    if (!supplier.items || itemIndex >= supplier.items.length) {
      return res.status(404).json({ message: 'Item not found' });
    }

    supplier.items[itemIndex] = {
      itemName,
      category,
      price,
      quantity,
      description,
      dateAdded: supplier.items[itemIndex].dateAdded
    };

    await supplier.save();

    res.json(supplier.items[itemIndex]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;