const mongoose = require("mongoose");

const adminUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password_hash: { type: String, required: true },
  },
  { timestamps: true, collection: "admin_users" }
);

module.exports = mongoose.model("AdminUser", adminUserSchema);
