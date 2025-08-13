import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AdminDashboard from "./pages/admin-dashboard";
import AdvancedDashboard from './pages/advanced-dashboard'
import Customer from "./pages/customer";
import CheckoutPage from "./pages/checkout";

function App() {
  return (
    <Router>
      <nav style={{ padding: "10px", background: "#f0f0f0" }}>
        <Link to="/" style={{ marginRight: "15px" }}>Dashboard</Link>
        <Link to="/customers">Customers</Link>
      </nav>

      <Routes>
        <Route path="/" element={<AdvancedDashboard />} />

        <Route path="/customers" element={<Customer />} />

        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
    </Router>
  );
}

export default App;
