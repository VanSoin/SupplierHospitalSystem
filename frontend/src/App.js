import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainDashboard from "./pages/MainDashboard";
import SupplierAuth from "./pages/SupplierAuth";
import SupplierProfile from "./pages/SupplierProfile";
import SupplierDashboard from "./pages/SupplierDashboard";
import HospitalAuth from "./pages/HospitalAuth";
import HospitalProfile from "./pages/HospitalProfile";  // ADD THIS LINE
import HospitalDashboard from "./pages/HospitalDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<MainDashboard />} />

        {/* Supplier Routes */}
        <Route path="/supplier-auth" element={<SupplierAuth />} />
        <Route path="/supplier-profile" element={<SupplierProfile />} />
        <Route path="/supplier-dashboard" element={<SupplierDashboard />} />

        {/* Hospital Routes */}
        <Route path="/hospital-auth" element={<HospitalAuth />} />
        <Route path="/hospital-profile" element={<HospitalProfile />} />  {/* ADD THIS LINE */}
        <Route path="/hospital-dashboard" element={<HospitalDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;