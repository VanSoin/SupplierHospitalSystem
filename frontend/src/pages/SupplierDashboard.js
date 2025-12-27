import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import ItemForm from "../components/ItemForm";
import "./SupplierDashboard.css";

const SupplierDashboard = () => {
  const [items, setItems] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const navigate = useNavigate();
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("supplierToken");
    
    if (!token) {
      navigate("/supplier-auth");
      return;
    }

    fetchSupplierData(token);
    fetchItems(token);
  }, [navigate]);

  const fetchSupplierData = async (token) => {
    try {
      const res = await axios.get("http://localhost:5000/api/suppliers/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSupplier(res.data);
      
      if (!res.data.profileComplete) {
        navigate("/supplier-profile");
      }
    } catch (err) {
      console.error("Error fetching supplier data:", err);
      localStorage.removeItem("supplierToken");
      localStorage.removeItem("supplierId");
      navigate("/supplier-auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (token) => {
    try {
      const res = await axios.get("http://localhost:5000/api/suppliers/items", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };
  const handleAcceptOrder = async (orderId) => {
  try {
    const token = localStorage.getItem('supplierToken');
    await axios.put(
  `http://localhost:5000/api/suppliers/orders/${orderId}/accept`,
  {},
  { headers: { Authorization: `Bearer ${token}` } }
);

    setOrders(orders.map(o => o._id === orderId ? { ...o, status: 'ACCEPTED' } : o));
  } catch (err) {
    console.error(err);
    alert('Failed to accept order');
  }
};

const handleRejectOrder = async (orderId) => {
  try {
    const token = localStorage.getItem('supplierToken');
    await axios.put(
  `http://localhost:5000/api/suppliers/orders/${orderId}/reject`,
  {},
  { headers: { Authorization: `Bearer ${token}` } }
);

    setOrders(orders.map(o => o._id === orderId ? { ...o, status: 'REJECTED' } : o));
  } catch (err) {
    console.error(err);
    alert('Failed to reject order');
  }
};


  const handleNewItem = (newItem) => {
    setItems((prev) => [...prev, newItem]);
  };

  const handleDeleteItem = async (index) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      const token = localStorage.getItem("supplierToken");
      
      // Remove item from state
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
      
      // Call backend to update
      await axios.delete(`http://localhost:5000/api/suppliers/items/${index}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert("Item deleted successfully!");
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Failed to delete item");
      // Refresh items to restore state
      fetchItems(localStorage.getItem("supplierToken"));
    }
  };

  const handleEditItem = (item, index) => {
    setEditingItem({ ...item, index });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateItem = async (updatedItem) => {
    try {
      const token = localStorage.getItem("supplierToken");
      
      await axios.put(
        `http://localhost:5000/api/suppliers/items/${editingItem.index}`,
        updatedItem,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state
      const updatedItems = [...items];
      updatedItems[editingItem.index] = updatedItem;
      setItems(updatedItems);
      
      setEditingItem(null);
      alert("Item updated successfully!");
    } catch (err) {
      console.error("Error updating item:", err);
      alert("Failed to update item");
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };
  const fetchOrders = async () => {
  setOrdersLoading(true);
  try {
    const token = localStorage.getItem("supplierToken");
    const res = await axios.get("http://localhost:5000/api/suppliers/orders", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setOrders(res.data);
    setShowOrdersModal(true);
  } catch (err) {
    console.error("Error fetching orders:", err);
    alert("Failed to fetch orders");
  } finally {
    setOrdersLoading(false);
  }
};

  const handleLogout = () => {
    localStorage.removeItem("supplierToken");
    localStorage.removeItem("supplierId");
    navigate("/supplier-auth");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="supplier-dashboard">
      <Sidebar />

      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h2>Welcome, {supplier?.name || "Supplier"}</h2>
            <p className="shop-name">{supplier?.shopName}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="supplier-info-card">
          <h3>Your Profile</h3>
          <p><strong>Email:</strong> {supplier?.email}</p>
          <p><strong>Shop:</strong> {supplier?.shopName}</p>
          <p><strong>Address:</strong> {supplier?.address}</p>
          <p><strong>Contact:</strong> {supplier?.contactNumber}</p>
          <p><strong>Rating:</strong> {'⭐'.repeat(Math.floor(supplier?.rating || 0))} ({supplier?.rating})</p>
          <p><strong>Location:</strong> {supplier?.location?.lat}, {supplier?.location?.lng}</p>
          <button 
            className="edit-profile-btn"
            onClick={() => navigate("/supplier-profile")}
          >
            Edit Profile
          </button>
        </div>

        <div className="add-item-section">
          <h3>{editingItem ? "Edit Item" : "Add Essential Items"}</h3>
          <ItemForm 
            onItemAdded={editingItem ? handleUpdateItem : handleNewItem} 
            editingItem={editingItem}
            onCancelEdit={handleCancelEdit}
          />
        </div>

        <div className="items-section">
          <h3>Your Items ({items.length})</h3>
          {items.length === 0 ? (
            <div className="no-items">
              <p>No items added yet.</p>
              <p>Start by adding items using the form above.</p>
            </div>
          ) : (
            <div className="items-grid">
              {items.map((item, idx) => (
                <div key={idx} className="item-card">
                  <h4>{item.itemName}</h4>
                  <p><strong>Category:</strong> {item.category}</p>
                  <p><strong>Price:</strong> ₹{item.price}</p>
                  <p><strong>Quantity:</strong> {item.quantity}</p>
                  {item.description && (
                    <p className="item-description">{item.description}</p>
                  )}
                  <small>Added: {new Date(item.dateAdded).toLocaleDateString()}</small>
                  
                  <div className="item-actions">
                    <button 
                      className="edit-item-btn"
                      onClick={() => handleEditItem(item, idx)}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      className="delete-item-btn"
                      onClick={() => handleDeleteItem(idx)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button 
        className="logout-btn" 
        onClick={fetchOrders} 
        disabled={ordersLoading}
        style={{ marginLeft: "10px" }}
      >
        View Orders
      </button>
       {showOrdersModal && (
  <div className="suppliers-modal-overlay" onClick={() => setShowOrdersModal(false)}>
    <div className="suppliers-modal" onClick={(e) => e.stopPropagation()}>
      <h2>Orders Received</h2>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        orders.map(order => (
          <div key={order._id} className="item-card">
    <h4>{order.equipmentName}</h4>
    <p><strong>Hospital:</strong> {order.hospital?.hospitalName || 'Unknown'}</p>
<p><strong>Email:</strong> {order.hospital?.email || 'N/A'}</p>
<p><strong>Address:</strong> {order.hospital?.hospitalAddress || 'N/A'}</p>
    <p><strong>Status:</strong> {order.status}</p>
    <small>Ordered on: {new Date(order.createdAt).toLocaleDateString()}</small>

    {order.status === 'PENDING' && (
      <div className="item-actions">
        <button onClick={() => handleAcceptOrder(order._id)}>✅ Accept</button>
        <button onClick={() => handleRejectOrder(order._id)}>❌ Reject</button>
      </div>
    )}
  </div>
        ))
      )}
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default SupplierDashboard;