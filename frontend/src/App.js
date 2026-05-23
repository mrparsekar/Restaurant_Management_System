import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Menu from "./components/Menu";
import Cart from "./components/Cart";
import Orders from "./components/Orders";

import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import AdminOrders from "./admin/AdminOrders";
import AdminMenu from "./admin/AdminMenu";
import OrderHistory from "./admin/OrderHistory";
import AdminLayout from "./admin/AdminLayout";

const AppRoutes = ({ cartCount, setCartCount, isAdminLoggedIn, handleAdminLogin }) => {
  const location = useLocation();
  const showCustomerNavbar = !location.pathname.startsWith("/admin");

  return (
    <>
      {showCustomerNavbar && <Navbar cartCount={cartCount} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu setCartCount={setCartCount} />} />
        <Route path="/cart" element={<Cart setCartCount={setCartCount} />} />
        <Route path="/orders" element={<Orders />} />

        <Route
          path="/admin"
          element={isAdminLoggedIn ? <Navigate to="/admin/dashboard" /> : <AdminLogin onLoginSuccess={handleAdminLogin} />}
        />

        {isAdminLoggedIn ? (
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="history" element={<OrderHistory />} />
          </Route>
        ) : (
          <Route path="/admin/*" element={<Navigate to="/admin" />} />
        )}
      </Routes>
    </>
  );
};

function App() {
  const [cartCount, setCartCount] = useState(0);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    setIsAdminLoggedIn(localStorage.getItem("isAdminLoggedIn") === "true");

    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartCount(storedCart.reduce((sum, item) => sum + item.quantity, 0));

    const onStorageChange = (event) => {
      if (event.key === "cart") {
        const parsedCart = JSON.parse(event.newValue || "[]");
        setCartCount(parsedCart.reduce((sum, item) => sum + item.quantity, 0));
      }
    };

    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, []);

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true);
    localStorage.setItem("isAdminLoggedIn", "true");
  };

  return (
    <Router>
      <AppRoutes
        cartCount={cartCount}
        setCartCount={setCartCount}
        isAdminLoggedIn={isAdminLoggedIn}
        handleAdminLogin={handleAdminLogin}
      />
    </Router>
  );
}

export default App;
