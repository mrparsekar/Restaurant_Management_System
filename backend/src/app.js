const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const AdminUser = require("./models/AdminUser");
const MenuItem = require("./models/MenuItem");
const Order = require("./models/Order");
const OrderHistory = require("./models/OrderHistory");
const Counter = require("./models/Counter");

const app = express();

app.use(cors());
app.use(express.json());

async function getNextSequence(key) {
  const counter = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return counter.seq;
}

app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const admin = await AdminUser.findOne({ username }).lean();
    if (!admin) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

app.get("/menu", async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ item_id: 1 }).lean();
    return res.json(items);
  } catch (error) {
    console.error("Menu fetch error:", error);
    return res.status(500).json({ error: "Database error" });
  }
});

app.post("/menu", async (req, res) => {
  const { name, price, category, image } = req.body;
  try {
    const itemId = await getNextSequence("menu_item_id");
    await MenuItem.create({
      item_id: itemId,
      name,
      price: Number(price),
      category,
      image: image || "",
      in_stock: true,
    });
    return res.status(201).json({ message: "Item added successfully" });
  } catch (error) {
    console.error("Add menu error:", error);
    return res.status(500).json({ error: "Failed to add item" });
  }
});

app.put("/menu/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, category, image } = req.body;
  try {
    const updated = await MenuItem.findOneAndUpdate(
      { item_id: Number(id) },
      { name, price: Number(price), category, image },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Item not found" });
    }
    return res.json({ message: "Item updated successfully" });
  } catch (error) {
    console.error("Update menu error:", error);
    return res.status(500).json({ error: "Failed to update item" });
  }
});

app.delete("/menu/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await MenuItem.deleteOne({ item_id: Number(id) });
    return res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Delete menu error:", error);
    return res.status(500).json({ error: "Failed to delete item" });
  }
});

app.put("/menu/:id/stock", async (req, res) => {
  const { id } = req.params;
  try {
    const item = await MenuItem.findOne({ item_id: Number(id) });
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    item.in_stock = !item.in_stock;
    await item.save();
    return res.json({ message: "Stock status updated" });
  } catch (error) {
    console.error("Stock toggle error:", error);
    return res.status(500).json({ error: "Failed to update stock status" });
  }
});

app.post("/orders", async (req, res) => {
  const { customerName, tableNumber, items, totalPrice } = req.body;
  if (!customerName || !tableNumber || !items || items.length === 0) {
    return res.status(400).json({ error: "Invalid order data." });
  }

  try {
    const orderId = await getNextSequence("order_id");
    const menuMap = new Map((await MenuItem.find({ item_id: { $in: items.map((i) => i.item_id) } }).lean()).map((m) => [m.item_id, m]));
    const normalizedItems = items.map((item) => ({
      item_id: item.item_id,
      name: menuMap.get(item.item_id)?.name || item.name || "Item",
      quantity: Number(item.quantity),
      price: Number(menuMap.get(item.item_id)?.price ?? item.price ?? 0),
    }));

    await Order.create({
      order_id: orderId,
      customer: {
        name: customerName,
        table_no: String(tableNumber),
      },
      items: normalizedItems,
      total_amount: Number(totalPrice || 0),
      order_status: "Pending",
      order_time: new Date(),
      payment_status: "Pending",
    });

    return res.json({ message: "Order placed successfully!" });
  } catch (error) {
    console.error("Place order error:", error);
    return res.status(500).json({ error: "Database error" });
  }
});

app.get("/orders", async (req, res) => {
  const { name, table_no: tableNo } = req.query;
  if (!name || !tableNo) {
    return res.status(400).json({ error: "Customer name and table number are required" });
  }

  try {
    const orders = await Order.find({
      "customer.name": name,
      "customer.table_no": String(tableNo),
    })
      .sort({ order_time: -1 })
      .lean();

    const rows = [];
    orders.forEach((order) => {
      order.items.forEach((item) => {
        rows.push({
          order_id: order.order_id,
          order_status: order.order_status,
          order_time: order.order_time,
          item_id: item.item_id,
          item_name: item.name,
          quantity: item.quantity,
          price: item.price,
        });
      });
    });
    return res.json(rows);
  } catch (error) {
    console.error("Fetch orders error:", error);
    return res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ order_time: -1 }).lean();
    const response = orders.map((order) => ({
      order_id: order.order_id,
      customer_name: order.customer.name,
      table_no: order.customer.table_no,
      order_status: order.order_status,
      order_time: order.order_time,
      total_amount: order.total_amount,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      })),
    }));
    return res.json(response);
  } catch (error) {
    console.error("Admin orders error:", error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.post("/api/admin/orders/:id/status", async (req, res) => {
  const orderId = Number(req.params.id);
  const { newStatus } = req.body;
  if (!orderId || !newStatus) {
    return res.status(400).json({ error: "Missing order ID or new status" });
  }

  try {
    const updated = await Order.findOneAndUpdate({ order_id: orderId }, { order_status: newStatus }, { new: true });
    if (!updated) {
      return res.status(404).json({ error: "Order not found" });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("Status update error:", error);
    return res.status(500).json({ error: "Failed to update status" });
  }
});

app.post("/api/admin/orders/:orderId/pay", async (req, res) => {
  const orderId = Number(req.params.orderId);
  try {
    const order = await Order.findOne({ order_id: orderId });
    if (!order || order.order_status !== "Served") {
      return res.status(404).json({ success: false, error: "Order not found or not served" });
    }

    const historyId = await getNextSequence("order_history_id");
    await OrderHistory.create({
      history_id: historyId,
      order_id: order.order_id,
      customer_name: order.customer.name,
      table_no: order.customer.table_no,
      items: order.items.map((item) => ({ item_name: item.name, quantity: item.quantity })),
      total_amount: order.total_amount,
      order_status: "Paid",
      order_time: order.order_time,
      paid_at: new Date(),
    });

    await Order.deleteOne({ order_id: orderId });
    return res.json({ success: true, message: "Order marked as paid and moved to history." });
  } catch (error) {
    console.error("Pay order error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.get("/dashboard/stats", async (req, res) => {
  try {
    const [totalOrders, pendingOrders, menuItemsCount, orderHistoryCount, revenueRows] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ order_status: { $ne: "Paid" } }),
      MenuItem.countDocuments(),
      OrderHistory.countDocuments(),
      OrderHistory.aggregate([{ $group: { _id: null, sum: { $sum: "$total_amount" } } }]),
    ]);

    const totalRevenue = revenueRows[0]?.sum || 0;
    return res.json({
      completedOrders: orderHistoryCount,
      totalOrders,
      pendingOrders,
      totalRevenue,
      menuItemsCount,
      orderHistoryCount,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/order-history", async (req, res) => {
  try {
    const orders = await OrderHistory.find().sort({ paid_at: -1 }).limit(100).lean();
    return res.json(orders);
  } catch (error) {
    console.error("Order history fetch error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/images", express.static("public/images"));

module.exports = app;
