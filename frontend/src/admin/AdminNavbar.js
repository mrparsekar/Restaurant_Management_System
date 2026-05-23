import React from "react";
import { NavLink } from "react-router-dom";
import "./admin.css";

const AdminNavbar = () => {
  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    window.location.href = "/admin";
  };

  return (
    <header className="admin-navbar">
      <div className="admin-brand">
        <p className="admin-kicker">Control Center</p>
        <h2 className="admin-title">Gourmet Haven Admin</h2>
      </div>

      <nav className="admin-links" aria-label="Admin navigation">
        <NavLink to="/admin/dashboard" className="admin-link">Dashboard</NavLink>
        <NavLink to="/admin/orders" className="admin-link">Orders</NavLink>
        <NavLink to="/admin/menu" className="admin-link">Menu</NavLink>
        <NavLink to="/admin/history" className="admin-link">History</NavLink>
      </nav>

      <button className="logout-btn" onClick={handleLogout}>Logout</button>
    </header>
  );
};

export default AdminNavbar;
