import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],

    // New Fields for Ratings & Reviews
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    reviews: [reviewSchema], // Array of reviews
  },
  { timestamps: true }
);

storeSchema.index({ location: "2dsphere" }); // Enable GeoJSON support

const Store = mongoose.model("Store", storeSchema);
export default Store;
