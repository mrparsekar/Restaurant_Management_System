import React from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";

const AdminLayout = () => {
  return (
    <div className="admin-shell">
      <AdminNavbar />
      <main className="admin-shell-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
