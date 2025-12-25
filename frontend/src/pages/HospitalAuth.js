import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HospitalAuth.css';

function HospitalAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await axios.post('http://localhost:5000/api/hospitals/login', formData);
        
        // Save token
        localStorage.setItem('hospitalToken', response.data.token);
        localStorage.setItem('hospitalId', response.data.hospital._id);
        
        // Check if profile is complete
        if (response.data.hospital.profileComplete) {
          navigate('/hospital-dashboard');
        } else {
          navigate('/hospital-profile');
        }
      } else {
        // Register
        const response = await axios.post('http://localhost:5000/api/hospitals/register', formData);
        
        // Save token
        localStorage.setItem('hospitalToken', response.data.token);
        localStorage.setItem('hospitalId', response.data.hospital._id);
        
        // After registration, always go to profile
        navigate('/hospital-profile');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hospital-auth-container">
      <div className="auth-box">
        <button 
          onClick={() => navigate('/')} 
          className="back-btn"
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '8px 16px',
            background: 'transparent',
            border: '2px solid #2a5298',
            color: '#2a5298',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#2a5298';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#2a5298';
          }}
        >
          ← Back to Home
        </button>

        <h2>{isLogin ? 'Hospital Login' : 'Hospital Registration'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter hospital email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              minLength="6"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <p className="toggle-auth">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default HospitalAuth;