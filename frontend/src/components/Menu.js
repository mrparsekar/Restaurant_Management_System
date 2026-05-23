import React, { useEffect, useMemo, useState } from "react";
import "./Menu.css";
import API_BASE_URL from "../config/api";

const categories = ["All", "Starters", "Main Course", "Desserts", "Drinks & Beverages", "Cocktails", "Mocktails"];

const Menu = ({ setCartCount }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/menu`);
        const data = await response.json();
        if (mounted) {
          setMenuItems(Array.isArray(data) ? data : []);
        }
      } catch {
        if (mounted) setMenuItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);
    setCartCount(storedCart.reduce((sum, item) => sum + item.quantity, 0));

    return () => {
      mounted = false;
    };
  }, [setCartCount]);

  const updateCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCartCount(updatedCart.reduce((sum, item) => sum + item.quantity, 0));
  };

  const handleCartChange = (item, action) => {
    let updatedCart = [...cart];
    const itemIndex = updatedCart.findIndex((cartItem) => cartItem.item_id === item.item_id);

    if (action === "add") {
      if (itemIndex !== -1) {
        updatedCart[itemIndex].quantity += 1;
      } else {
        updatedCart.push({ ...item, quantity: 1 });
      }
    }

    if (action === "increase" && itemIndex !== -1) {
      updatedCart[itemIndex].quantity += 1;
    }

    if (action === "decrease" && itemIndex !== -1) {
      updatedCart[itemIndex].quantity -= 1;
      if (updatedCart[itemIndex].quantity <= 0) {
        updatedCart = updatedCart.filter((cartItem) => cartItem.item_id !== item.item_id);
      }
    }

    updateCart(updatedCart);
  };

  const filteredItems = useMemo(
    () => (selectedCategory === "All" ? menuItems : menuItems.filter((item) => item.category === selectedCategory)),
    [menuItems, selectedCategory]
  );

  return (
    <main className="menu-container">
      <h2 className="menu-title">Menu</h2>
      <p className="menu-subtitle">Choose a category and add dishes instantly.</p>

      <div className="category-container">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? "active" : ""}`}
            onClick={() => setSelectedCategory(category)}
            disabled={loading}
          >
            {category}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="loading-text">Loading menu...</p>
      ) : filteredItems.length === 0 ? (
        <p className="no-items">No items found in this category.</p>
      ) : (
        <section className="menu-grid">
          {filteredItems.map((item) => {
            const cartItem = cart.find((cartEntry) => cartEntry.item_id === item.item_id);

            return (
              <article key={item.item_id} className="menu-card">
                <img src={item.image} alt={item.name} className="menu-image" />
                <div className="menu-body">
                  <h3 className="item-name">{item.name}</h3>
                  <p className="item-category">{item.category}</p>
                  <p className="item-price">Rs. {Number(item.price).toFixed(2)}</p>

                  {item.in_stock ? (
                    cartItem ? (
                      <div className="quantity-controls">
                        <button onClick={() => handleCartChange(item, "decrease")}>-</button>
                        <span>{cartItem.quantity}</span>
                        <button onClick={() => handleCartChange(item, "increase")}>+</button>
                      </div>
                    ) : (
                      <button className="add-to-cart-btn" onClick={() => handleCartChange(item, "add")}>Add to Cart</button>
                    )
                  ) : (
                    <div className="out-of-stock-label">Out of Stock</div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
};

export default Menu;
