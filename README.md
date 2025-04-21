# 🍽️ Restaurant Management System

A full-stack restaurant management web application built using **React.js**, **Node.js**, and **MySQL**. This system allows customers to browse the menu, place orders, and track status, while the admin can manage orders, menu items, and billing efficiently.

---

## 🚀 Features

### 👥 Customer Side
- Browse categorized menu (Starters, Main Course, Desserts, Drinks, etc.)
- Add items to cart and place an order
- View order status updates in real-time
- Responsive UI with quantity control

### 🔐 Admin Side
- Secure admin login with MySQL-backed authentication
- Dashboard with statistics: total orders, revenue, item count
- Manage orders with status flow:
  `Pending → Approved → Preparing → Ready → Served → Paid`
- Manage menu: add, update, delete, mark items out of stock
- View billing and order history with filters
- Graphs for revenue and order status (using Recharts)

---

## 🛠️ Tech Stack

- **Frontend:** React.js + Vite, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Others:** Recharts (for graphs), LocalStorage (for cart), bcrypt (for password hashing)

---

## 📸 Screenshots

| Page | Screenshot |
|------|------------|
| Home Page | ![Home](screenshots/home.png) |
| Menu Page | ![Menu](screenshots/menu.png) |
| Admin Login | ![Admin Login](screenshots/admin-login.png) |
| Admin Dashboard | ![Dashboard](screenshots/dashboard.png) |
| Manage Orders | ![Orders](screenshots/manage-orders.png) |
| Manage Menu | ![Menu Admin](screenshots/manage-menu.png) |
| Order History | ![Order History](screenshots/order-history.png) |

> 📁 Create a `screenshots/` folder and place your image files there with appropriate names.

---

## 📦 Database Schema

- `menu`: item_id, name, category, price, image, in_stock
- `orders`: order_id, name, table_number, item_id, quantity, status, timestamps
- `admin_users`: id, username, password_hash
- `paid_orders`: order_id, paid_at, customer_name, table_no, items, total_amount, paid_at
- `customers`: customer_id, name, table_no
- `order_history`: history_id, order_id, customer_name, table_no, order_time, items, total_amount, status, paid_at, order_status
- `order_items`: order_item_id, order_id, item_id, quantity
- `payments` : payment_id, order_id, total_amount, payment_status, payment_time

---

## 🔐 Admin Credentials

username: admin

password: gourmethaven@123

---

## ⚙️ Setup Instructions

1. **Clone the repo**

git clone https://github.com/your-username/restaurant-management.git
cd restaurant-management

2. Install backend dependencies

cd backend
npm install

3. Install frontend dependencies

cd ../frontend
npm install

4. Start MySQL & create tables Import schema.sql (provide it if you have one).

5. Run backend

cd backend
node server.js

6. Run frontend
cd frontend
npm run dev

