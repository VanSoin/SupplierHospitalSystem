import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HospitalProfile.css';

function HospitalProfile() {
  const [formData, setFormData] = useState({
    hospitalName: '',
    hospitalAddress: '',
    latitude: '',
    longitude: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('hospitalToken');
    if (!token) {
      navigate('/hospital-auth');
      return;
    }

    // If profile already exists, load it
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('hospitalToken');
      const response = await axios.get('http://localhost:5000/api/hospitals/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setFormData({
          hospitalName: response.data.hospitalName || '',
          hospitalAddress: response.data.hospitalAddress || '',
          latitude: response.data.location?.lat || '',
          longitude: response.data.location?.lng || ''
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
    localStorage.removeItem('hospitalToken');
    localStorage.removeItem('hospitalId');
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('hospitalToken');
      
      // Prepare data with location object
      const profileData = {
        hospitalName: formData.hospitalName,
        hospitalAddress: formData.hospitalAddress,
        location: {
          lat: parseFloat(formData.latitude),
          lng: parseFloat(formData.longitude)
        }
      };
      
      await axios.post('http://localhost:5000/api/hospitals/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Navigate to dashboard after successful profile creation
      navigate('/hospital-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hospital-profile-container">
      <button 
        onClick={handleBack} 
        className="back-btn-profile"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '8px 16px',
          background: 'white',
          border: '2px solid #2a5298',
          color: '#2a5298',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '14px',
          transition: 'all 0.3s',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#2a5298';
          e.target.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'white';
          e.target.style.color = '#2a5298';
        }}
      >
        ← Back to Home
      </button>

      <div className="profile-box">
        <h2>Complete Your Hospital Profile</h2>
        <p className="subtitle">Please fill in your hospital details to continue</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Hospital Name *</label>
            <input
              type="text"
              name="hospitalName"
              value={formData.hospitalName}
              onChange={handleChange}
              required
              placeholder="Enter your hospital name"
            />
          </div>

          <div className="form-group">
            <label>Hospital Address *</label>
            <textarea
              name="hospitalAddress"
              value={formData.hospitalAddress}
              onChange={handleChange}
              required
              placeholder="Enter your complete hospital address"
              rows="4"
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

export default HospitalProfile;