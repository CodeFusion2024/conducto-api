import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    }, // Linked to Store
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // Products under this category
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);
export default Category;
