const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    item_id: { type: Number, required: true },
    name: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    order_id: { type: Number, unique: true, index: true },
    customer: {
      name: { type: String, required: true, trim: true },
      table_no: { type: String, required: true },
    },
    items: { type: [orderItemSchema], default: [] },
    order_status: { type: String, default: "Pending" },
    order_time: { type: Date, default: Date.now },
    total_amount: { type: Number, default: 0 },
    payment_status: { type: String, default: "Pending" },
    payment_time: { type: Date },
  },
  { timestamps: true, collection: "orders" }
);

module.exports = mongoose.model("Order", orderSchema);
