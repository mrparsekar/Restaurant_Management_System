import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./AdminLogin.css";
import API_BASE_URL from "../config/api";

const STATIC_ADMIN_USERNAME = "admin123";
const STATIC_ADMIN_PASSWORD = "Admin@007";

function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeLogin = () => {
    localStorage.setItem("isAdminLoggedIn", "true");
    onLoginSuccess();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    if (username.trim() === STATIC_ADMIN_USERNAME && password === STATIC_ADMIN_PASSWORD) {
      completeLogin();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/login`, {
        username: username.trim(),
        password,
      });

      if (res.data.message === "Login successful") {
        completeLogin();
      } else {
        setError("Invalid credentials.");
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-wrapper">
      <header className="login-brand-header">
        <Link to="/" className="brand-wrap">
          <img src="/logo.png" alt="Gourmet Haven" className="brand-logo" />
          <div>
            <p className="brand-kicker">Restaurant Management</p>
            <h1 className="brand-name">Gourmet Haven</h1>
          </div>
        </Link>
      </header>

      <div className="login-card">
        <p className="admin-badge">Secure Access</p>
        <h2 className="login-title">Admin Login</h2>
        <p className="login-subtitle">Use your credentials to access dashboard controls</p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <Link to="/" className="back-link">Back to Restaurant</Link>
      </div>
    </div>
  );
}

export default AdminLogin;
