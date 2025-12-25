import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./HospitalDashboard.css";

const HospitalDashboard = () => {
  const [hospital, setHospital] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    equipmentName: "",
    quantity: "",
    urgency: "normal"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [matchedSupplier, setMatchedSupplier] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [findingMatchFor, setFindingMatchFor] = useState(null);
  const [requestMatches, setRequestMatches] = useState({});
  const [editingRequest, setEditingRequest] = useState(null);
  const [showSuppliers, setShowSuppliers] = useState(false);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("hospitalToken");
    
    if (!token) {
      navigate("/hospital-auth");
      return;
    }

    fetchHospitalData(token);
    fetchRequests(token);
  }, [navigate]);

  const fetchHospitalData = async (token) => {
    try {
      const res = await axios.get("http://localhost:5000/api/hospitals/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setHospital(res.data);
      
      if (!res.data.profileComplete) {
        navigate("/hospital-profile");
      }
    } catch (err) {
      console.error("Error fetching hospital data:", err);
      localStorage.removeItem("hospitalToken");
      localStorage.removeItem("hospitalId");
      navigate("/hospital-auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async (token) => {
    try {
      const res = await axios.get("http://localhost:5000/api/hospitals/requests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  // NEW: Fetch all suppliers
  const fetchAllSuppliers = async () => {
    setSuppliersLoading(true);
    try {
      const token = localStorage.getItem("hospitalToken");
      const res = await axios.get("http://localhost:5000/api/hospitals/view-suppliers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllSuppliers(res.data);
      setShowSuppliers(true);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      alert("Failed to load suppliers");
    } finally {
      setSuppliersLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
    setSuccess("");
    setMatchedSupplier(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setMatchedSupplier(null);

    if (!formData.equipmentName || !formData.quantity) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    setMatchLoading(true);

    try {
      const token = localStorage.getItem("hospitalToken");
      
      if (editingRequest !== null) {
        await axios.put(
          `http://localhost:5000/api/hospitals/requests/${editingRequest}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        fetchRequests(token);
        setSuccess("Request updated successfully!");
        setEditingRequest(null);
        setFormData({
          equipmentName: "",
          quantity: "",
          urgency: "normal"
        });
        setMatchLoading(false);
        return;
      }

      const matchResponse = await axios.post(
        "http://localhost:5000/api/match/find-supplier",
        {
          equipmentName: formData.equipmentName,
          quantity: parseInt(formData.quantity)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (matchResponse.data.success) {
        setMatchedSupplier(matchResponse.data);
        
        const requestResponse = await axios.post(
          "http://localhost:5000/api/hospitals/requests",
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setSuccess("Equipment request submitted successfully! Supplier matched.");
        setRequests([requestResponse.data, ...requests]);
        
        setFormData({
          equipmentName: "",
          quantity: "",
          urgency: "normal"
        });
      }
    } catch (err) {
      console.error("Error:", err);
      if (err.response?.status === 404) {
        setError(err.response.data.message || "No suppliers found for this equipment");
      } else {
        setError(err.response?.data?.message || "Failed to submit request");
      }
    } finally {
      setMatchLoading(false);
    }
  };

  const findSupplierForRequest = async (request, index) => {
    setFindingMatchFor(index);
    
    try {
      const token = localStorage.getItem("hospitalToken");
      
      const matchResponse = await axios.post(
        "http://localhost:5000/api/match/find-supplier",
        {
          equipmentName: request.equipmentName,
          quantity: parseInt(request.quantity)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (matchResponse.data.success) {
        setRequestMatches(prev => ({
          ...prev,
          [index]: matchResponse.data
        }));
      }
    } catch (err) {
      console.error("Error finding supplier:", err);
      alert(err.response?.data?.message || "No suppliers found for this equipment");
    } finally {
      setFindingMatchFor(null);
    }
  };

  const handleDeleteRequest = async (index) => {
    if (!window.confirm("Are you sure you want to delete this request?")) {
      return;
    }

    try {
      const token = localStorage.getItem("hospitalToken");
      
      await axios.delete(`http://localhost:5000/api/hospitals/requests/${index}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRequests(requests.filter((_, i) => i !== index));
      
      if (requestMatches[index]) {
        const newMatches = { ...requestMatches };
        delete newMatches[index];
        setRequestMatches(newMatches);
      }
      
      alert("Request deleted successfully!");
      
    } catch (err) {
      console.error("Error deleting request:", err);
      alert("Failed to delete request");
    }
  };

  const handleEditRequest = (request, index) => {
    setEditingRequest(index);
    setFormData({
      equipmentName: request.equipmentName,
      quantity: request.quantity,
      urgency: request.urgency
    });
    setMatchedSupplier(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingRequest(null);
    setFormData({
      equipmentName: "",
      quantity: "",
      urgency: "normal"
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("hospitalToken");
    localStorage.removeItem("hospitalId");
    navigate("/hospital-auth");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="hospital-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Hospital Dashboard</h1>
          <p className="hospital-name">{hospital?.hospitalName}</p>
        </div>
        <div className="header-actions">
          <button 
            className="view-suppliers-btn"
            onClick={fetchAllSuppliers}
            disabled={suppliersLoading}
          >
            {suppliersLoading ? "Loading..." : "👥 View All Suppliers"}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Hospital Info Card */}
        <div className="hospital-info-card">
          <h3>Hospital Information</h3>
          <p><strong>Name:</strong> {hospital?.hospitalName}</p>
          <p><strong>Email:</strong> {hospital?.email}</p>
          <p><strong>Address:</strong> {hospital?.hospitalAddress}</p>
          <p><strong>Location:</strong> {hospital?.location?.lat}, {hospital?.location?.lng}</p>
          <button 
            className="edit-profile-btn"
            onClick={() => navigate("/hospital-profile")}
          >
            Edit Profile
          </button>
        </div>

        {/* Suppliers Modal/Section */}
        {showSuppliers && (
          <div className="suppliers-modal-overlay" onClick={() => setShowSuppliers(false)}>
            <div className="suppliers-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>All Suppliers in System ({allSuppliers.length})</h2>
                <button className="close-modal-btn" onClick={() => setShowSuppliers(false)}>
                  ✕
                </button>
              </div>
              
              <div className="suppliers-list">
                {allSuppliers.length === 0 ? (
                  <p className="no-suppliers">No suppliers registered yet.</p>
                ) : (
                  allSuppliers.map((supplier, idx) => (
                    <div key={idx} className="supplier-profile-card">
                      <div className="supplier-profile-header">
                        <div>
                          <h3>{supplier.shopName}</h3>
                          <p className="owner-name">Owner: {supplier.name}</p>
                        </div>
                        <div className="supplier-rating-badge">
                          {'⭐'.repeat(Math.floor(supplier.rating))}
                          {supplier.rating % 1 !== 0 && '✨'}
                          <span>({supplier.rating})</span>
                        </div>
                      </div>

                      <div className="supplier-profile-details">
                        <div className="detail-row">
                          <span className="detail-icon">📧</span>
                          <span><strong>Email:</strong> {supplier.email}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-icon">📞</span>
                          <span><strong>Contact:</strong> {supplier.contactNumber}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-icon">📍</span>
                          <span><strong>Address:</strong> {supplier.address}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-icon">🗺️</span>
                          <span><strong>Location:</strong> {supplier.location?.lat}, {supplier.location?.lng}</span>
                        </div>
                      </div>

                      <div className="supplier-items-section">
                        <h4>Available Items ({supplier.items?.length || 0})</h4>
                        {supplier.items && supplier.items.length > 0 ? (
                          <div className="supplier-items-grid">
                            {supplier.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="supplier-item-mini">
                                <p className="item-name">{item.itemName}</p>
                                <p className="item-details">
                                  <span>₹{item.price}</span> • <span>{item.quantity} units</span>
                                </p>
                                <p className="item-category">{item.category}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-items-text">No items available</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Request Equipment Form */}
        <div className="request-form-section">
          <h3>{editingRequest !== null ? "Edit Equipment Request" : "Request Emergency Equipment"}</h3>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleSubmit} className="request-form">
            <div className="form-row">
              <div className="form-group">
                <label>Equipment Name *</label>
                <input
                  type="text"
                  name="equipmentName"
                  value={formData.equipmentName}
                  onChange={handleChange}
                  placeholder="e.g., Ventilators, Oxygen Cylinders"
                  required
                />
              </div>

              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Urgency Level *</label>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                required
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={matchLoading}>
                {matchLoading ? "Processing..." : (editingRequest !== null ? "Update Request" : "Submit Request")}
              </button>
              
              {editingRequest !== null && (
                <button 
                  type="button" 
                  onClick={handleCancelEdit} 
                  className="cancel-btn"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Matched Supplier Display */}
        {matchedSupplier && (
          <div className="matched-supplier-section">
            <h3>✅ Supplier Match Found!</h3>
            <div className="supplier-match-card">
              <div className="supplier-header">
                <div>
                  <h4>{matchedSupplier.supplier.shopName}</h4>
                  <p className="supplier-name">Owner: {matchedSupplier.supplier.name}</p>
                </div>
                <div className="supplier-rating">
                  {'⭐'.repeat(Math.floor(matchedSupplier.supplier.rating))}
                  {matchedSupplier.supplier.rating % 1 !== 0 && '✨'}
                  <span className="rating-number">({matchedSupplier.supplier.rating.toFixed(1)})</span>
                </div>
              </div>

              <div className="supplier-details">
                <div className="detail-item">
                  <span className="detail-label">📍 Distance:</span>
                  <span className="detail-value">{matchedSupplier.supplier.distance.toFixed(2)} km away</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">📦 Available Quantity:</span>
                  <span className="detail-value">{matchedSupplier.supplier.availableQuantity} units</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">💰 Price:</span>
                  <span className="detail-value">₹{matchedSupplier.supplier.price}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">📞 Contact:</span>
                  <span className="detail-value">{matchedSupplier.supplier.contactNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">📍 Address:</span>
                  <span className="detail-value">{matchedSupplier.supplier.address}</span>
                </div>
              </div>

              <div className="match-reasons">
                <h5>Why this supplier was selected:</h5>
                <ul>
                  {matchedSupplier.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>

              {matchedSupplier.alternativeSuppliers && matchedSupplier.alternativeSuppliers.length > 0 && (
                <div className="alternative-suppliers">
                  <h5>Alternative Suppliers Available:</h5>
                  <div className="alt-suppliers-list">
                    {matchedSupplier.alternativeSuppliers.map((alt, idx) => (
                      <div key={idx} className="alt-supplier-item">
                        <strong>{alt.shopName}</strong>
                        <span>{'⭐'.repeat(Math.floor(alt.rating))} ({alt.rating}) • {alt.distance.toFixed(1)} km</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Previous Requests */}
        <div className="requests-section">
          <h3>Your Equipment Requests ({requests.length})</h3>
          {requests.length === 0 ? (
            <div className="no-requests">
              <p>No requests submitted yet.</p>
              <p>Use the form above to request emergency equipment.</p>
            </div>
          ) : (
            <div className="requests-list">
              {requests.map((request, idx) => (
                <div key={idx} className="request-card">
                  <div className="request-header">
                    <h4>{request.equipmentName}</h4>
                    <span className={`urgency-badge ${request.urgency}`}>
                      {request.urgency}
                    </span>
                  </div>
                  <p><strong>Quantity:</strong> {request.quantity}</p>
                  <p><strong>Status:</strong> <span className={`status-${request.status}`}>{request.status}</span></p>
                  <small>Requested: {new Date(request.dateRequested).toLocaleString()}</small>
                  
                  <div className="request-actions">
                    {!requestMatches[idx] && (
                      <button 
                        className="find-supplier-btn"
                        onClick={() => findSupplierForRequest(request, idx)}
                        disabled={findingMatchFor === idx}
                      >
                        {findingMatchFor === idx ? "Finding..." : "🔍 Find Supplier"}
                      </button>
                    )}
                    
                    <button 
                      className="edit-request-btn"
                      onClick={() => handleEditRequest(request, idx)}
                    >
                      ✏️ Edit
                    </button>
                    
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteRequest(idx)}
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  {requestMatches[idx] && (
                    <div className="request-match-info">
                      <h5>✅ Matched Supplier:</h5>
                      <div className="mini-supplier-card">
                        <p><strong>{requestMatches[idx].supplier.shopName}</strong></p>
                        <p>Rating: {'⭐'.repeat(Math.floor(requestMatches[idx].supplier.rating))} ({requestMatches[idx].supplier.rating})</p>
                        <p>Distance: {requestMatches[idx].supplier.distance.toFixed(2)} km</p>
                        <p>Contact: {requestMatches[idx].supplier.contactNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;