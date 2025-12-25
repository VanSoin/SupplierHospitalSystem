import React from "react";
import { useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear both tokens
    localStorage.removeItem("supplierToken");
    localStorage.removeItem("supplierId");
    localStorage.removeItem("supplierUser"); // Clear old data too
    navigate("/supplier-auth");
  };

  return (
    <div style={{
      width: "200px",
      padding: "20px",
      background: "#ff7e5f",
      color: "white",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      boxShadow: "2px 0 10px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ textAlign: "center" }}>Dashboard</h2>
      
      <button
        onClick={() => navigate("/supplier-profile")}
        style={{
          padding: "10px",
          borderRadius: "5px",
          border: "none",
          background: "white",
          color: "#ff7e5f",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        Profile
      </button>
      
      <button
        onClick={() => navigate("/supplier-dashboard")}
        style={{
          padding: "10px",
          borderRadius: "5px",
          border: "none",
          background: "white",
          color: "#ff7e5f",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        Add Item
      </button>
      
      <button
        onClick={handleLogout}
        style={{
          padding: "10px",
          borderRadius: "5px",
          border: "none",
          background: "white",
          color: "#ff7e5f",
          cursor: "pointer",
          fontWeight: "bold",
          marginTop: "auto"
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Sidebar;