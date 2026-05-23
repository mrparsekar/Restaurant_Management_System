import React, { useMemo, useState } from "react";
import "./AdminOrders.css";
import API_BASE_URL from "../config/api";

const STATUS_FLOW = ["Pending", "Approved", "Preparing", "Ready", "Served"];

const AdminOrders = () => {
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [processingOrderId, setProcessingOrderId] = React.useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchOrders = React.useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/admin/orders`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch(() => setError("Failed to fetch orders."))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getNextStatus = (currentStatus) => {
    const index = STATUS_FLOW.indexOf(currentStatus);
    return index >= 0 && index < STATUS_FLOW.length - 1 ? STATUS_FLOW[index + 1] : null;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setProcessingOrderId(orderId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus }),
      });
      if (res.ok) fetchOrders();
      else alert("Failed to update order status.");
    } catch {
      alert("Error updating order status.");
    } finally {
      setProcessingOrderId(null);
    }
  };

  const markAsPaid = async (orderId) => {
    setProcessingOrderId(orderId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/pay`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) fetchOrders();
      else alert("Failed to mark order as paid.");
    } catch {
      alert("Payment update failed.");
    } finally {
      setProcessingOrderId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchText = `${order.order_id} ${order.customer_name} ${order.table_no}`.toLowerCase();
      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || order.order_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  return (
    <section className="admin-orders">
      <div className="orders-head">
        <h2>Manage Orders</h2>
        <div className="orders-filters">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order/customer/table"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            {STATUS_FLOW.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button className="refresh-btn" onClick={fetchOrders}>Refresh</button>
        </div>
      </div>

      {loading ? <p>Loading orders...</p> : error ? <p className="error-text">{error}</p> : (
        <>
          <p className="results-count">Showing {filteredOrders.length} of {orders.length} orders</p>
          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th><th>Customer</th><th>Table</th><th>Items</th><th>Status</th><th>Time</th><th>Total</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const nextStatus = getNextStatus(order.order_status);
                  const itemsFormatted = order.items?.map((item) => `${item.name} (x${item.quantity})`).join(", ") || "-";

                  return (
                    <tr key={order.order_id}>
                      <td>{order.order_id}</td>
                      <td>{order.customer_name}</td>
                      <td>{order.table_no}</td>
                      <td>{itemsFormatted}</td>
                      <td><span className={`status-chip status-${order.order_status.toLowerCase()}`}>{order.order_status}</span></td>
                      <td>{new Date(order.order_time).toLocaleString()}</td>
                      <td>Rs. {Number(order.total_amount).toFixed(2)}</td>
                      <td>
                        <div className="order-actions">
                          {nextStatus ? (
                            <button className="status-btn" onClick={() => updateOrderStatus(order.order_id, nextStatus)} disabled={processingOrderId === order.order_id}>Mark {nextStatus}</button>
                          ) : <span className="done-status">Completed</span>}
                          {order.order_status === "Served" && (
                            <button className="pay-btn" onClick={() => markAsPaid(order.order_id)} disabled={processingOrderId === order.order_id}>Mark Paid</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};

export default AdminOrders;
