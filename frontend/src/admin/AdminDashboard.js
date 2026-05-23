import React, { useEffect, useMemo, useState } from "react";
import {
  FaUtensils,
  FaClipboardList,
  FaHistory,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaChair,
  FaFire,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./AdminDashboard.css";
import API_BASE_URL from "../config/api";

const COLORS = ["#2f6ea1", "#b55b2a", "#2f7d4f", "#7f5ca8", "#d2563f"];

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    menuItemsCount: 0,
    pendingOrders: 0,
    completedOrders: 0,
    orderHistoryCount: 0,
    totalRevenue: 0,
  });
  const [activeOrders, setActiveOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, activeRes, historyRes, menuRes] = await Promise.all([
          fetch(`${API_BASE_URL}/dashboard/stats`),
          fetch(`${API_BASE_URL}/api/admin/orders`),
          fetch(`${API_BASE_URL}/order-history`),
          fetch(`${API_BASE_URL}/menu`),
        ]);

        const [statsData, activeData, historyData, menuData] = await Promise.all([
          statsRes.json(),
          activeRes.json(),
          historyRes.json(),
          menuRes.json(),
        ]);

        setStats(statsData || {});
        setActiveOrders(Array.isArray(activeData) ? activeData : []);
        setHistoryOrders(Array.isArray(historyData) ? historyData : []);
        setMenuItems(Array.isArray(menuData) ? menuData : []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    load();
  }, []);

  const insights = useMemo(() => {
    const activeByStatusMap = activeOrders.reduce((acc, order) => {
      const status = order.order_status || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const activeByStatus = Object.entries(activeByStatusMap).map(([status, count]) => ({ status, count }));

    const tableVolumeMap = activeOrders.reduce((acc, order) => {
      const table = `Table ${order.table_no}`;
      acc[table] = (acc[table] || 0) + 1;
      return acc;
    }, {});

    const topTables = Object.entries(tableVolumeMap)
      .map(([table, orders]) => ({ table, orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 6);

    const dishMap = new Map();
    activeOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.name || "Item";
        const prev = dishMap.get(key) || 0;
        dishMap.set(key, prev + Number(item.quantity || 0));
      });
    });

    const topDishes = Array.from(dishMap.entries())
      .map(([name, qty]) => ({ name: name.length > 18 ? `${name.slice(0, 18)}...` : name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    const revenueByDayMap = historyOrders.reduce((acc, order) => {
      const dateKey = new Date(order.paid_at || order.order_time).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
      acc[dateKey] = (acc[dateKey] || 0) + Number(order.total_amount || 0);
      return acc;
    }, {});

    const revenueByDay = Object.entries(revenueByDayMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .slice(-10);

    const lowStockCount = menuItems.filter((item) => !item.in_stock).length;

    return { activeByStatus, topTables, topDishes, revenueByDay, lowStockCount };
  }, [activeOrders, historyOrders, menuItems]);

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">Dashboard Overview</h1>

      <div className="dashboard-cards">
        <div className="card"><FaClipboardList className="card-icon" /><div className="card-info"><p>Active Orders</p><h3>{stats.totalOrders || activeOrders.length}</h3></div></div>
        <div className="card"><FaChartLine className="card-icon" /><div className="card-info"><p>Total Revenue</p><h3>Rs. {Number(stats.totalRevenue || 0).toFixed(0)}</h3></div></div>
        <div className="card"><FaUtensils className="card-icon" /><div className="card-info"><p>Menu Items</p><h3>{stats.menuItemsCount || menuItems.length}</h3></div></div>
        <div className="card"><FaCheckCircle className="card-icon" /><div className="card-info"><p>Paid Orders</p><h3>{stats.completedOrders || stats.orderHistoryCount || historyOrders.length}</h3></div></div>
        <div className="card"><FaClock className="card-icon" /><div className="card-info"><p>Pending Queue</p><h3>{stats.pendingOrders || 0}</h3></div></div>
        <div className="card"><FaHistory className="card-icon" /><div className="card-info"><p>Order History</p><h3>{stats.orderHistoryCount || historyOrders.length}</h3></div></div>
        <div className="card"><FaChair className="card-icon" /><div className="card-info"><p>Busiest Table</p><h3>{insights.topTables[0]?.table || "-"}</h3></div></div>
        <div className="card"><FaFire className="card-icon" /><div className="card-info"><p>Out of Stock</p><h3>{insights.lowStockCount}</h3></div></div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3 className="chart-title">Revenue Trend (Paid Orders)</h3>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={insights.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#b55b2a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Active Orders by Status</h3>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.activeByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#2f6ea1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Top Active Dishes</h3>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.topDishes} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip />
                <Bar dataKey="qty" fill="#2f7d4f" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Top Tables by Active Orders</h3>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={insights.topTables} dataKey="orders" nameKey="table" outerRadius={88} label>
                  {insights.topTables.map((entry, index) => (
                    <Cell key={entry.table} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
