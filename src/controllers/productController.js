import Product from "../models/Product.js";
import Category from "../models/Category.js";

// ➤ Create a Product
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, images, categoryId, storeId } = req.body;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    // Check if store exists
    if (category.store.toString() !== storeId)
      return res.status(400).json({ message: "Category does not belong to this store" });

    // Validate image count
    if (images.length > 10) return res.status(400).json({ message: "You can upload only up to 10 images" });

    const product = new Product({ name, description, price, images, category: categoryId, store: storeId });
    await product.save();

    // Add product to category
    category.products.push(product._id);
    await category.save();

    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { userId, rating, comment } = req.body;

    // Find the product
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Check if the user has already reviewed
    const existingReview = product.reviews.find((r) => r.user.toString() === userId);
    if (existingReview) return res.status(400).json({ message: "You have already reviewed this product" });

    // Add new review
    product.reviews.push({ user: userId, rating, comment });

    // Update total reviews & average rating
    product.totalReviews = product.reviews.length;
    product.averageRating =
      product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.totalReviews;

    await product.save();
    res.status(201).json({ message: "Review added successfully", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ➤ Get Product with Reviews
export const getProductWithReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId).populate("reviews.user", "name email");
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ➤ Get Products by Category
export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const products = await Product.find({ category: categoryId });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ➤ Get Product by ID
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId)
      .populate("category", "name")
      .populate("store", "name")
      .populate("reviews.user", "name email");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ➤ Get All Products
export const getAllProducts = async (req, res) => {
  try {
    // Retrieve all products and populate related fields
    const products = await Product.find()
      .populate("category", "name") // Populate category name
      .populate("store", "name") // Populate store name
      .populate("reviews.user", "name email"); // Populate user details for reviews

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};