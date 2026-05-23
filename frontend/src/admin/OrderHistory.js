import React, { useEffect, useMemo, useState } from "react";
import "./OrderHistory.css";
import API_BASE_URL from "../config/api";

const normalizeItems = (items) => {
  if (Array.isArray(items)) {
    return items.map((item) => {
      if (typeof item === "string") {
        return { item_name: item, quantity: 1 };
      }

      return {
        item_name: item?.item_name || item?.name || "Item",
        quantity: Number(item?.quantity || 1),
      };
    });
  }

  if (typeof items === "string") {
    return items
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => ({ item_name: entry, quantity: 1 }));
  }

  return [];
};

const OrderHistory = () => {
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/order-history`);
        const data = await response.json();

        if (Array.isArray(data)) {
          setOrderHistory(data);
        } else {
          setMessage(data.message || "No order history found.");
        }
      } catch (error) {
        console.error("Error fetching order history:", error);
        setMessage("Failed to load order history.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    return orderHistory.filter((order) => {
      const searchText = `${order.order_id} ${order.customer_name} ${order.table_no} ${order.order_status}`.toLowerCase();
      return searchText.includes(search.toLowerCase());
    });
  }, [orderHistory, search]);

  if (loading) return <div className="loading-message">Loading order history...</div>;
  if (orderHistory.length === 0) return <div className="no-record-message">{message || "No order history found."}</div>;

  return (
    <div className="order-history-wrapper">
      <div className="history-head">
        <h2 className="order-history-heading">Order History</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order/customer/table/status"
        />
      </div>
      <p className="results-count">Showing {filteredHistory.length} of {orderHistory.length} records</p>
      <div className="order-history-scroll">
        <table className="order-history-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Table</th>
              <th>Order Time</th>
              <th>Items</th>
              <th>Total</th>
              <th>Paid At</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((order) => {
              const parsedItems = normalizeItems(order.items);

              return (
                <tr key={order.history_id}>
                  <td>{order.order_id}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.table_no}</td>
                  <td>{order.order_time ? new Date(order.order_time).toLocaleString() : "N/A"}</td>
                  <td className="items-cell">
                    {parsedItems.length > 0 ? (
                      parsedItems.map((item, idx) => (
                        <span key={`${order.history_id}-${idx}`} className="item-pill">{item.item_name} x{item.quantity}</span>
                      ))
                    ) : (
                      <span className="item-pill">No Items</span>
                    )}
                  </td>
                  <td>Rs. {Number(order.total_amount || 0).toFixed(2)}</td>
                  <td>{order.paid_at ? new Date(order.paid_at).toLocaleString() : "N/A"}</td>
                  <td><span className="history-status">{order.order_status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderHistory;
