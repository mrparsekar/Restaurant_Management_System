import React, { useEffect, useState } from "react";
import "./Cart.css";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

const Cart = ({ setCartCount }) => {
  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState(localStorage.getItem("customerName") || "");
  const [tableNumber, setTableNumber] = useState(localStorage.getItem("tableNumber") || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(storedCart);
    setCartCount(storedCart.reduce((sum, item) => sum + item.quantity, 0));
  }, [setCartCount]);

  const syncCart = (updatedCart) => {
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCartCount(updatedCart.reduce((sum, item) => sum + item.quantity, 0));
  };

  const removeFromCart = (index) => {
    const updatedCart = cartItems.filter((_, i) => i !== index);
    syncCart(updatedCart);
  };

  const total = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const handleOrder = async () => {
    if (!customerName.trim() || !tableNumber.trim()) {
      alert("Please enter your name and table number.");
      return;
    }

    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    localStorage.setItem("customerName", customerName.trim());
    localStorage.setItem("tableNumber", tableNumber.trim());

    const orderData = {
      customerName: customerName.trim(),
      tableNumber: tableNumber.trim(),
      items: cartItems,
      totalPrice: total,
      status: "Pending",
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error("Order request failed");
      }

      alert("Order placed successfully!");
      localStorage.removeItem("cart");
      syncCart([]);
      navigate("/orders");
    } catch (error) {
      console.error("Order submission error:", error);
      alert("Could not place the order right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="cart-container">
      <section className="cart-list-panel">
        <h2>Your Cart</h2>
        {cartItems.length > 0 ? (
          <div className="cart-list">
            {cartItems.map((item, index) => (
              <article key={index} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-image" />
                <div className="cart-details">
                  <h4>{item.name}</h4>
                  <p>Rs. {Number(item.price).toFixed(2)} x {item.quantity}</p>
                </div>
                <button onClick={() => removeFromCart(index)} className="remove-btn">Remove</button>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-cart">Your cart is empty.</p>
        )}
      </section>

      <aside className="checkout-panel">
        <h3>Checkout</h3>
        <p className="checkout-total">Total: Rs. {total.toFixed(2)}</p>
        <input
          type="text"
          placeholder="Your name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="input-field"
        />
        <input
          type="number"
          placeholder="Table number"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          className="input-field"
        />
        <button className="order-btn" onClick={handleOrder} disabled={isSubmitting}>
          {isSubmitting ? "Placing Order..." : "Place Order"}
        </button>
      </aside>
    </main>
  );
};

export default Cart;
