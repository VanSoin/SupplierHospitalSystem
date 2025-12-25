import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SupplierProfile.css';

function SupplierProfile() {
  const [formData, setFormData] = useState({
    name: '',
    shopName: '',
    address: '',
    contactNumber: '',
    latitude: '',
    longitude: '',
    rating: '5'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('supplierToken');
    if (!token) {
      navigate('/supplier-auth');
      return;
    }

    // If profile already exists, load it
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('supplierToken');
      const response = await axios.get('http://localhost:5000/api/suppliers/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setFormData({
          name: response.data.name || '',
          shopName: response.data.shopName || '',
          address: response.data.address || '',
          contactNumber: response.data.contactNumber || '',
          latitude: response.data.location?.lat || '',
          longitude: response.data.location?.lng || '',
          rating: response.data.rating || '5'
        });
      }
    } catch (err) {
      // Profile doesn't exist yet, that's fine
      console.log('No existing profile');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBack = () => {
    // Clear tokens and go back to home
    localStorage.removeItem('supplierToken');
    localStorage.removeItem('supplierId');
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('supplierToken');
      
      // Prepare data with location object
      const profileData = {
        name: formData.name,
        shopName: formData.shopName,
        address: formData.address,
        contactNumber: formData.contactNumber,
        location: {
          lat: parseFloat(formData.latitude),
          lng: parseFloat(formData.longitude)
        },
        rating: parseFloat(formData.rating)
      };
      
      await axios.post('http://localhost:5000/api/suppliers/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Navigate to dashboard after successful profile creation
      navigate('/supplier-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="supplier-profile-container">
      <button 
        onClick={handleBack} 
        className="back-btn-profile"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '8px 16px',
          background: 'white',
          border: '2px solid #667eea',
          color: '#667eea',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '14px',
          transition: 'all 0.3s',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#667eea';
          e.target.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'white';
          e.target.style.color = '#667eea';
        }}
      >
        ← Back to Home
      </button>

      <div className="profile-box">
        <h2>Complete Your Supplier Profile</h2>
        <p className="subtitle">Please fill in your details to continue</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Shop Name *</label>
            <input
              type="text"
              name="shopName"
              value={formData.shopName}
              onChange={handleChange}
              required
              placeholder="Enter your shop name"
            />
          </div>

          <div className="form-group">
            <label>Shop Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="Enter your complete shop address"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Contact Number *</label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              required
              placeholder="Enter your contact number"
              pattern="[0-9]{10}"
              title="Please enter a 10-digit phone number"
            />
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Latitude *</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
                placeholder="e.g., 12.9716"
              />
            </div>

            <div className="form-group">
              <label>Longitude *</label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
                placeholder="e.g., 77.5946"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Shop Rating (1-5) *</label>
            <select
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              required
            >
              <option value="5">⭐⭐⭐⭐⭐ (5 - Excellent)</option>
              <option value="4.5">⭐⭐⭐⭐✨ (4.5 - Very Good)</option>
              <option value="4">⭐⭐⭐⭐ (4 - Good)</option>
              <option value="3.5">⭐⭐⭐✨ (3.5 - Above Average)</option>
              <option value="3">⭐⭐⭐ (3 - Average)</option>
              <option value="2.5">⭐⭐✨ (2.5 - Below Average)</option>
              <option value="2">⭐⭐ (2 - Poor)</option>
              <option value="1.5">⭐✨ (1.5 - Very Poor)</option>
              <option value="1">⭐ (1 - Terrible)</option>
            </select>
          </div>

          <p style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '10px' }}>
            💡 Tip: Use Google Maps to find your coordinates
          </p>

          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SupplierProfile;