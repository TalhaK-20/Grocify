import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AdminDashboard from "./pages/admin-dashboard";
import AdvancedDashboard from './pages/advanced-dashboard'
import Customer from "./pages/customer";

function App() {
  return (
    <Router>
      {/* Simple Navigation */}
      <nav style={{ padding: "10px", background: "#f0f0f0" }}>
        <Link to="/" style={{ marginRight: "15px" }}>Dashboard</Link>
        <Link to="/customers">Customers</Link>
      </nav>

      <Routes>
        {/* Default route */}
        <Route path="/" element={<AdvancedDashboard />} />

        {/* Customer page */}
        <Route path="/customers" element={<Customer />} />
      </Routes>
    </Router>
  );
}

export default App;
