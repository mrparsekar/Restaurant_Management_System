const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    item_id: { type: Number, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, default: "" },
    in_stock: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "menu" }
);

module.exports = mongoose.model("MenuItem", menuItemSchema);
