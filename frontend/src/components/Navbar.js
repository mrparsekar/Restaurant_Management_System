import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ cartCount }) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <nav className="navbar">
        <NavLink to="/" className="brand" onClick={() => setOpen(false)}>
          <img src="logo.png" alt="Gourmet Haven" className="brand-logo" />
          <span>Gourmet Haven</span>
        </NavLink>

        <button className="menu-button" onClick={() => setOpen((v) => !v)} aria-label="Navigation menu">
          {open ? "Close" : "Menu"}
        </button>

        <div className={`links ${open ? "show" : ""}`}>
          <NavLink to="/" className="link" onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/menu" className="link" onClick={() => setOpen(false)}>Menu</NavLink>
          <NavLink to="/cart" className="link" onClick={() => setOpen(false)}>
            Cart {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </NavLink>
          <NavLink to="/orders" className="link" onClick={() => setOpen(false)}>Orders</NavLink>
          <NavLink to="/admin" className="link admin" onClick={() => setOpen(false)}>Admin</NavLink>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
