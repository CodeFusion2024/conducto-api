import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid"; // Import UUID

const categorySchema = new mongoose.Schema(
  {
    categoryId: { type: String, unique: true, default: uuidv4 }, // Unique Category ID
    name: { type: String, required: true, trim: true },
    description: { type: String },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);
export default Category;