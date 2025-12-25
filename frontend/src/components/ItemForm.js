import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ItemForm.css";

const ItemForm = ({ onItemAdded, editingItem, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    price: "",
    quantity: "",
    description: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = [
    "Surgical Equipment",
    "Medicines",
    "Personal Protection Equipment (PPE)",
    "Diagnostic Equipment",
    "Hospital Furniture",
    "Medical Consumables",
    "Laboratory Equipment",
    "Emergency Equipment",
    "Other"
  ];

  // Load editing item data
  useEffect(() => {
    if (editingItem) {
      setFormData({
        itemName: editingItem.itemName || "",
        category: editingItem.category || "",
        price: editingItem.price || "",
        quantity: editingItem.quantity || "",
        description: editingItem.description || ""
      });
    }
  }, [editingItem]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (!formData.itemName || !formData.category || !formData.price || !formData.quantity) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (formData.price <= 0 || formData.quantity <= 0) {
      setError("Price and quantity must be greater than 0");
      setLoading(false);
      return;
    }

    try {
      if (editingItem) {
        // Update existing item
        onItemAdded(formData);
        setSuccess("Item updated successfully!");
      } else {
        // Add new item
        const token = localStorage.getItem("supplierToken");
        
        if (!token) {
          setError("Please login again");
          setLoading(false);
          return;
        }

        const res = await axios.post(
          "http://localhost:5000/api/suppliers/items",
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setSuccess("Item added successfully!");
        
        if (onItemAdded) {
          onItemAdded(res.data);
        }
      }

      // Clear form
      setFormData({
        itemName: "",
        category: "",
        price: "",
        quantity: "",
        description: ""
      });

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Failed to save item");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      itemName: "",
      category: "",
      price: "",
      quantity: "",
      description: ""
    });
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  return (
    <div className="item-form-container">
      <form onSubmit={handleSubmit} className="item-form">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="form-row">
          <div className="form-group">
            <label>Item Name *</label>
            <input
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              placeholder="e.g., Surgical Gloves"
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Price (₹) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Quantity Available *</label>
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
          <label>Description (Optional)</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add any additional details about the item..."
            rows="3"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Saving..." : (editingItem ? "Update Item" : "Add Item")}
          </button>
          
          {editingItem && (
            <button 
              type="button" 
              onClick={handleCancel} 
              className="cancel-btn"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ItemForm;