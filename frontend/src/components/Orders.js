import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Orders.css";
import API_BASE_URL from "../config/api";

const REFRESH_MS = 15000;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [customerName, setCustomerName] = useState(localStorage.getItem("customerName") || "");
  const [tableNumber, setTableNumber] = useState(localStorage.getItem("tableNumber") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const abortRef = useRef(null);

  const canFetch = useMemo(() => customerName.trim() && tableNumber.trim(), [customerName, tableNumber]);

  const fetchOrders = useCallback(async () => {
    if (!canFetch) {
      setError("Enter both name and table number to fetch your orders.");
      setOrders([]);
      return;
    }

    localStorage.setItem("customerName", customerName.trim());
    localStorage.setItem("tableNumber", tableNumber.trim());

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");

    try {
      const query = `name=${encodeURIComponent(customerName.trim())}&table_no=${encodeURIComponent(tableNumber.trim())}`;
      const response = await fetch(`${API_BASE_URL}/orders?${query}`, { signal: controller.signal });
      const data = await response.json();

      if (!response.ok || !Array.isArray(data)) {
        throw new Error("Invalid server response");
      }

      const grouped = data.reduce((acc, order) => {
        if (!acc[order.order_id]) {
          acc[order.order_id] = {
            order_id: order.order_id,
            order_status: order.order_status,
            order_time: order.order_time,
            total_price: 0,
            items: [],
          };
        }

        const lineTotal = Number(order.quantity) * Number(order.price);
        acc[order.order_id].items.push({
          item_name: order.item_name,
          quantity: Number(order.quantity),
          price: Number(order.price),
          lineTotal,
        });
        acc[order.order_id].total_price += lineTotal;
        return acc;
      }, {});

      const normalized = Object.values(grouped).sort((a, b) => new Date(b.order_time) - new Date(a.order_time));
      setOrders(normalized);
      setLastUpdated(new Date());
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Unable to fetch orders right now. Please check details and try again.");
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  }, [canFetch, customerName, tableNumber]);

  useEffect(() => {
    if (canFetch) {
      fetchOrders();
    }

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [canFetch, fetchOrders]);

  useEffect(() => {
    if (!autoRefresh || !canFetch) return undefined;

    const interval = setInterval(() => {
      fetchOrders();
    }, REFRESH_MS);

    return () => clearInterval(interval);
  }, [autoRefresh, canFetch, fetchOrders]);

  return (
    <main className="orders-container">
      <div className="orders-header">
        <h2>Track Your Orders</h2>
        <label className="refresh-toggle">
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          Auto refresh every 15s
        </label>
      </div>

      <div className="input-group">
        <input type="text" placeholder="Your name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        <input type="number" placeholder="Table number" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />
        <button onClick={fetchOrders} disabled={loading}>{loading ? "Fetching..." : "Fetch Orders"}</button>
      </div>

      {lastUpdated && <p className="updated-at">Last updated: {lastUpdated.toLocaleTimeString()}</p>}
      {error && <p className="error-message">{error}</p>}

      {orders.length > 0 ? (
        <section className="orders-grid">
          {orders.map((order) => (
            <article key={order.order_id} className="order-card">
              <div className="order-top">
                <h3>Order #{order.order_id}</h3>
                <span className="order-status">{order.order_status}</span>
              </div>
              <p className="order-time">{new Date(order.order_time).toLocaleString()}</p>

              <ul className="ordered-items">
                {order.items.map((item, idx) => (
                  <li key={`${order.order_id}-${idx}`}>
                    <span>{item.item_name} x{item.quantity}</span>
                    <strong>Rs. {item.lineTotal.toFixed(2)}</strong>
                  </li>
                ))}
              </ul>

              <p className="total-price">Total: Rs. {order.total_price.toFixed(2)}</p>
            </article>
          ))}
        </section>
      ) : (
        !loading && !error && <p className="no-orders-message">No orders found for this name and table yet.</p>
      )}
    </main>
  );
};

export default Orders;
