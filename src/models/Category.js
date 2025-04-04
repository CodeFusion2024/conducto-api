import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    }, // Linked to Store
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // Products under this category
  },
  { timestamps: true }
);

// Ensure unique category names per store
categorySchema.index({ store: 1, name: 1 }, { unique: true });

// Optimize queries by indexing store
categorySchema.index({ store: 1 });

const Category = mongoose.model("Category", categorySchema);
export default Category;
