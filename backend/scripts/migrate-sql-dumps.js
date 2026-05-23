/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const AdminUser = require("../src/models/AdminUser");
const MenuItem = require("../src/models/MenuItem");
const Order = require("../src/models/Order");
const OrderHistory = require("../src/models/OrderHistory");
const Counter = require("../src/models/Counter");

function parseSqlValue(token) {
  const t = token.trim();
  if (t.toUpperCase() === "NULL") return null;
  if (t.startsWith("'") && t.endsWith("'")) {
    return t
      .slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, "\\");
  }
  const num = Number(t);
  return Number.isNaN(num) ? t : num;
}

function splitTupleFields(tupleText) {
  const fields = [];
  let current = "";
  let inString = false;

  for (let i = 0; i < tupleText.length; i += 1) {
    const ch = tupleText[i];
    const prev = tupleText[i - 1];

    if (ch === "'" && prev !== "\\") {
      inString = !inString;
      current += ch;
      continue;
    }

    if (ch === "," && !inString) {
      fields.push(parseSqlValue(current));
      current = "";
      continue;
    }

    current += ch;
  }

  if (current.length > 0) fields.push(parseSqlValue(current));
  return fields;
}

function extractInsertRows(sqlText, tableName) {
  const re = new RegExp(`INSERT INTO\\s+\`${tableName}\`\\s+VALUES\\s+([\\s\\S]*?);`, "gi");
  const blocks = [];
  let match = re.exec(sqlText);
  while (match) {
    blocks.push(match[1]);
    match = re.exec(sqlText);
  }

  const rows = [];
  for (const block of blocks) {
    let i = 0;
    while (i < block.length) {
      while (i < block.length && block[i] !== "(") i += 1;
      if (i >= block.length) break;
      i += 1;

      let inString = false;
      let depth = 1;
      let tuple = "";
      while (i < block.length && depth > 0) {
        const ch = block[i];
        const prev = block[i - 1];
        if (ch === "'" && prev !== "\\") inString = !inString;
        if (!inString) {
          if (ch === "(") depth += 1;
          if (ch === ")") depth -= 1;
        }
        if (depth > 0) tuple += ch;
        i += 1;
      }
      rows.push(splitTupleFields(tuple));
    }
  }

  return rows;
}

function loadDump(dumpDir, fileName) {
  return fs.readFileSync(path.join(dumpDir, fileName), "utf8");
}

async function run() {
  const dumpDir = process.argv[2];
  if (!dumpDir) {
    throw new Error("Usage: node scripts/migrate-sql-dumps.js <dump-folder-path>");
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

  const adminSql = loadDump(dumpDir, "restaurant_db_admin_users.sql");
  const menuSql = loadDump(dumpDir, "restaurant_db_menu.sql");
  const customersSql = loadDump(dumpDir, "restaurant_db_customers.sql");
  const ordersSql = loadDump(dumpDir, "restaurant_db_orders.sql");
  const orderItemsSql = loadDump(dumpDir, "restaurant_db_order_items.sql");
  const paymentsSql = loadDump(dumpDir, "restaurant_db_payments.sql");
  const orderHistorySql = loadDump(dumpDir, "restaurant_db_order_history.sql");
  const paidOrdersSql = loadDump(dumpDir, "restaurant_db_paid_orders.sql");

  const adminRows = extractInsertRows(adminSql, "admin_users");
  const menuRows = extractInsertRows(menuSql, "menu");
  const customerRows = extractInsertRows(customersSql, "customers");
  const orderRows = extractInsertRows(ordersSql, "orders");
  const orderItemRows = extractInsertRows(orderItemsSql, "order_items");
  const paymentRows = extractInsertRows(paymentsSql, "payments");
  const orderHistoryRows = extractInsertRows(orderHistorySql, "order_history");
  const paidOrderRows = extractInsertRows(paidOrdersSql, "paid_orders");

  await Promise.all([
    AdminUser.deleteMany({}),
    MenuItem.deleteMany({}),
    Order.deleteMany({}),
    OrderHistory.deleteMany({}),
    Counter.deleteMany({}),
  ]);

  const admins = adminRows.map((r) => ({
    username: r[1],
    password_hash: r[2],
  }));
  if (admins.length) await AdminUser.insertMany(admins, { ordered: false });

  const menuDocs = menuRows.map((r) => ({
    item_id: Number(r[0]),
    name: r[1],
    category: r[2] || "Uncategorized",
    price: Number(r[3]),
    image: r[4] || "",
    in_stock: Boolean(r[5]),
  }));
  if (menuDocs.length) await MenuItem.insertMany(menuDocs, { ordered: false });

  const customerMap = new Map(customerRows.map((r) => [Number(r[0]), { name: r[1], table_no: String(r[2]) }]));
  const menuMap = new Map(menuDocs.map((m) => [m.item_id, m]));
  const itemsByOrder = new Map();
  for (const r of orderItemRows) {
    const orderId = Number(r[1]);
    const itemId = Number(r[2]);
    const quantity = Number(r[3]);
    const ref = menuMap.get(itemId);
    const items = itemsByOrder.get(orderId) || [];
    items.push({
      item_id: itemId,
      name: ref?.name || `Item ${itemId}`,
      quantity,
      price: ref?.price ?? 0,
    });
    itemsByOrder.set(orderId, items);
  }

  const paymentByOrder = new Map();
  for (const r of paymentRows) {
    paymentByOrder.set(Number(r[1]), {
      total_amount: Number(r[2]),
      payment_status: r[3] || "Pending",
      payment_time: r[4] ? new Date(r[4]) : null,
    });
  }

  const orderDocs = orderRows.map((r) => {
    const orderId = Number(r[0]);
    const customerId = Number(r[1]);
    const payment = paymentByOrder.get(orderId);
    const items = itemsByOrder.get(orderId) || [];
    const computedTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return {
      order_id: orderId,
      customer: customerMap.get(customerId) || { name: "Unknown", table_no: "0" },
      items,
      order_status: r[2] || "Pending",
      order_time: r[3] ? new Date(r[3]) : new Date(),
      total_amount: payment?.total_amount ?? computedTotal,
      payment_status: payment?.payment_status ?? "Pending",
      payment_time: payment?.payment_time ?? null,
    };
  });
  if (orderDocs.length) await Order.insertMany(orderDocs, { ordered: false });

  const historyDocs = orderHistoryRows.map((r) => ({
    history_id: Number(r[0]),
    order_id: Number(r[1]),
    customer_name: r[2] || "Unknown",
    table_no: String(r[3] ?? ""),
    order_time: r[4] ? new Date(r[4]) : null,
    items: r[5] || "",
    total_amount: Number(r[6] || 0),
    paid_at: r[7] ? new Date(r[7]) : new Date(),
    order_status: r[8] || "Paid",
  }));

  const maxHistoryId = historyDocs.reduce((max, d) => Math.max(max, d.history_id), 0);
  const paidAsHistory = paidOrderRows.map((r, idx) => ({
    history_id: maxHistoryId + idx + 1,
    order_id: Number(r[1]),
    customer_name: r[2] || "Unknown",
    table_no: String(r[3] ?? ""),
    items: r[4] || "",
    total_amount: Number(r[5] || 0),
    paid_at: r[6] ? new Date(r[6]) : new Date(),
    order_status: "Paid",
  }));

  const allHistory = [...historyDocs, ...paidAsHistory];
  if (allHistory.length) await OrderHistory.insertMany(allHistory, { ordered: false });

  const maxOrderId = orderDocs.reduce((max, d) => Math.max(max, d.order_id), 0);
  const maxMenuId = menuDocs.reduce((max, d) => Math.max(max, d.item_id), 0);
  const finalMaxHistoryId = allHistory.reduce((max, d) => Math.max(max, d.history_id), 0);

  await Counter.insertMany([
    { _id: "order_id", seq: maxOrderId },
    { _id: "menu_item_id", seq: maxMenuId },
    { _id: "order_history_id", seq: finalMaxHistoryId },
  ]);

  console.log("Migration complete.");
  console.log(
    JSON.stringify(
      {
        admin_users: admins.length,
        menu: menuDocs.length,
        orders: orderDocs.length,
        order_history: allHistory.length,
        counters: 3,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Migration failed:", err.message);
  try {
    await mongoose.disconnect();
  } catch (_e) {
    // no-op
  }
  process.exit(1);
});
