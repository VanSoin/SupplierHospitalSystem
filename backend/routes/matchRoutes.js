const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const Supplier = require('../models/Supplier');
const Order = require('../models/Order');

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Middleware to verify hospital token
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );
    req.hospitalId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

// Find best supplier AND create order
router.post('/find-supplier', authMiddleware, async (req, res) => {
  try {
    const { equipmentName, quantity, urgency } = req.body;

    // Get hospital location
    const hospital = await Hospital.findById(req.hospitalId);
    if (
      !hospital ||
      !hospital.location ||
      !hospital.location.lat ||
      !hospital.location.lng
    ) {
      return res.status(400).json({ message: 'Hospital location not set' });
    }

    const hospitalLat = hospital.location.lat;
    const hospitalLng = hospital.location.lng;

    // Get all valid suppliers
    const suppliers = await Supplier.find({
      profileComplete: true,
      'location.lat': { $exists: true, $ne: 0 },
      'location.lng': { $exists: true, $ne: 0 },
      rating: { $exists: true, $gte: 1 }
    });

    if (!suppliers.length) {
      return res.status(404).json({ message: 'No suppliers available' });
    }

    // Match suppliers with required item
    let matchingSuppliers = [];

    suppliers.forEach(supplier => {
      if (!supplier.items || !supplier.items.length) return;

      const item = supplier.items.find(
        i =>
          i.itemName.toLowerCase() === equipmentName.toLowerCase() &&
          i.quantity >= quantity
      );

      if (item) {
        const distance = calculateDistance(
          hospitalLat,
          hospitalLng,
          supplier.location.lat,
          supplier.location.lng
        );

        matchingSuppliers.push({
          supplierId: supplier._id,
          name: supplier.name,
          shopName: supplier.shopName,
          rating: supplier.rating,
          contactNumber: supplier.contactNumber,
          address: supplier.address,
          distance,
          availableQuantity: item.quantity,
          price: item.price
        });
      }
    });

    if (!matchingSuppliers.length) {
      return res.status(404).json({
        message: `No suppliers found with ${equipmentName} (min ${quantity})`
      });
    }

    // Sort by rating (desc), then distance (asc)
    matchingSuppliers.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return a.distance - b.distance;
    });

    const bestSupplier = matchingSuppliers[0];

    // Selection reasons
    const reasons = ['Has requested item in stock'];

    if (bestSupplier.rating >= 4.5)
      reasons.push('Excellent supplier rating');
    else if (bestSupplier.rating >= 4)
      reasons.push('Very good supplier rating');
    else reasons.push('Good supplier rating');

    if (bestSupplier.distance < 5)
      reasons.push('Closest supplier (<5 km)');
    else if (bestSupplier.distance < 10)
      reasons.push('Near supplier (<10 km)');
    else reasons.push('Nearby supplier');

    // CREATE ORDER
   const order = await Order.create({
  hospital: req.hospitalId,
  supplier: bestSupplier.supplierId,
  status: 'PENDING',
  equipmentName,
  quantity,
  urgency
});


await Hospital.findByIdAndUpdate(req.hospitalId, {
  $push: {
    requests: {
      orderId: order._id,
      equipmentName,
      quantity,
      urgency
    }
  }
});






    // Final response
    res.json({
      success: true,
      orderId: order._id,
      supplier: bestSupplier,
      reasons,
      alternativeSuppliers: matchingSuppliers.slice(1, 4)
    });
  } catch (err) {
    console.error('Matching error:', err);
    res.status(500).json({ message: 'Server error during matching' });
  }
});

module.exports = router;
