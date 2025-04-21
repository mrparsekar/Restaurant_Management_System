// routes/adminRoutes.js
const express = require("express");
const mysql = require("mysql2"); // 
const router = express.Router();

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "restaurant_db",
  connectionLimit: 10,
});

// ✅ Mark order as Paid
router.post("/orders/:orderId/pay", (req, res) => {
  const orderId = req.params.orderId;

  const query = `
    SELECT 
      o.order_id,
      c.name AS customer_name,
      c.table_no,
      GROUP_CONCAT(CONCAT(m.name, ' (x', oi.quantity, ')') SEPARATOR ', ') AS items,
      o.order_status,
      o.order_time,
      p.total_amount
    FROM Orders o
    JOIN Customers c ON o.customer_id = c.customer_id
    JOIN Order_Items oi ON o.order_id = oi.order_id
    JOIN Menu m ON oi.item_id = m.item_id
    LEFT JOIN Payments p ON o.order_id = p.order_id
    WHERE o.order_id = ?
    GROUP BY o.order_id, c.name, c.table_no, o.order_status, o.order_time, p.total_amount
  `;

  db.query(query, [orderId], (err, results) => {
    if (err || results.length === 0) {
      console.error("Error fetching order for payment:", err);
      return res.status(500).json({ error: "Failed to fetch order" });
    }

    const order = results[0];

    const insertQuery = `
      INSERT INTO Order_History (order_id, customer_name, table_no, items, order_status, order_time, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      order.order_id,
      order.customer_name,
      order.table_no,
      order.items,
      "Paid",
      order.order_time,
      order.total_amount,
    ];

    db.query(insertQuery, values, (insertErr) => {
      if (insertErr) {
        console.error("Error inserting to Order_History:", insertErr);
        return res.status(500).json({ error: "Failed to store order history" });
      }

      db.query(
        "UPDATE Orders SET order_status = 'Paid' WHERE order_id = ?",
        [orderId],
        (updateErr) => {
          if (updateErr) {
            console.error("Error updating status:", updateErr);
            return res.status(500).json({ error: "Failed to mark as paid" });
          }
          res.json({ success: true, message: "Marked as Paid and moved to history" });
        }
      );
    });
  });
});

module.exports = router;
