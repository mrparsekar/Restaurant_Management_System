const mongoose = require("mongoose");

const orderHistorySchema = new mongoose.Schema(
  {
    history_id: { type: Number, unique: true, index: true },
    order_id: { type: Number, index: true },
    customer_name: { type: String, required: true },
    table_no: { type: String, required: true },
    items: { type: mongoose.Schema.Types.Mixed, required: true },
    total_amount: { type: Number, required: true },
    order_status: { type: String, default: "Paid" },
    order_time: { type: Date },
    paid_at: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "order_history" }
);

module.exports = mongoose.model("OrderHistory", orderHistorySchema);
