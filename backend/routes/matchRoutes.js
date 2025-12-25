const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const Supplier = require('../models/Supplier');

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance; // Returns distance in km
}

// Middleware to verify hospital token
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.hospitalId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Find best supplier for equipment request
router.post('/find-supplier', authMiddleware, async (req, res) => {
  try {
    const { equipmentName, quantity } = req.body;

    // Get hospital location
    const hospital = await Hospital.findById(req.hospitalId);
    if (!hospital || !hospital.location || !hospital.location.lat || !hospital.location.lng) {
      return res.status(400).json({ message: 'Hospital location not set' });
    }

    const hospitalLat = hospital.location.lat;
    const hospitalLng = hospital.location.lng;

    // Get all suppliers with complete profiles
    const suppliers = await Supplier.find({
      profileComplete: true,
      'location.lat': { $exists: true, $ne: 0 },
      'location.lng': { $exists: true, $ne: 0 },
      rating: { $exists: true, $gte: 1 }
    });

    if (suppliers.length === 0) {
      return res.status(404).json({ message: 'No suppliers available' });
    }

    // Find suppliers who have the requested item
    let matchingSuppliers = [];

    suppliers.forEach(supplier => {
      // Check if supplier has items
      if (!supplier.items || supplier.items.length === 0) {
        return; // Skip suppliers with no items
      }

      // Find the item in supplier's inventory (case-insensitive)
      const item = supplier.items.find(
        i => i.itemName.toLowerCase() === equipmentName.toLowerCase() && i.quantity >= quantity
      );

      if (item) {
        // Calculate distance
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
          distance: distance,
          availableQuantity: item.quantity,
          price: item.price,
          itemDetails: item
        });
      }
    });

    if (matchingSuppliers.length === 0) {
      return res.status(404).json({ 
        message: `No suppliers found with ${equipmentName} (minimum ${quantity} units)` 
      });
    }

    // Sort suppliers by:
    // 1. Rating (highest first)
    // 2. Distance (closest first)
    matchingSuppliers.sort((a, b) => {
      // First compare by rating (higher is better)
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      // If ratings are equal, compare by distance (closer is better)
      return a.distance - b.distance;
    });

    // Get the best supplier
    const bestSupplier = matchingSuppliers[0];

    // Determine reasons for selection
    const reasons = [];
    reasons.push('Has the requested item in stock');
    
    if (bestSupplier.rating >= 4.5) {
      reasons.push('Highest rated supplier (Excellent rating)');
    } else if (bestSupplier.rating >= 4) {
      reasons.push('High rated supplier (Very Good rating)');
    } else {
      reasons.push('Good rated supplier');
    }

    if (bestSupplier.distance < 5) {
      reasons.push('Closest supplier to your location (< 5 km)');
    } else if (bestSupplier.distance < 10) {
      reasons.push('Close proximity to your location (< 10 km)');
    } else {
      reasons.push('Nearby supplier');
    }

    if (bestSupplier.availableQuantity >= quantity * 2) {
      reasons.push('Sufficient stock available (more than required)');
    } else {
      reasons.push('Adequate stock available');
    }

    res.json({
      success: true,
      supplier: bestSupplier,
      reasons: reasons,
      alternativeSuppliers: matchingSuppliers.slice(1, 4) // Send up to 3 alternatives
    });

  } catch (err) {
    console.error('Matching error:', err);
    res.status(500).json({ message: 'Server error during matching' });
  }
});

module.exports = router;