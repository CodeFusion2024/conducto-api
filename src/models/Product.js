import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    images: [{ type: String, required: true }], // Up to 10 images

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },

    // New Fields for Ratings & Reviews
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    reviews: [reviewSchema], // Array of reviews
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
