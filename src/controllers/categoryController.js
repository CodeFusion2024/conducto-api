import Category from "../models/Category.js";
import Store from "../models/Store.js";
import mongoose from "mongoose";

// ➤ Create a Category Under a Store
export const createCategory = async (req, res) => {
  try {
    const { name, description, storeId } = req.body;

    console.log("Received storeId:", storeId); // Log the received storeId

    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      return res.status(400).json({ message: "Invalid Store ID format" });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      console.log("Store not found in DB"); // Log if store is not found
      return res.status(404).json({ message: "Store not found" });
    }

    const category = new Category({ name, description, store: storeId });
    await category.save();

    store.categories.push(category._id);
    await store.save();

    res.status(201).json({ message: "Category created successfully", category });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get All Categories Across All Stores
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate("store", "name"); // Populating store name
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ➤ Get All Categories Under a Store
export const getCategoriesByStore = async (req, res) => {
  try {
    const { storeId } = req.params;

    const categories = await Category.find({ store: storeId });
    
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Update a Category Under a Store
export const updateCategory = async (req, res) => {
  try {
    const { storeId, categoryId } = req.params;

    // Ensure the category belongs to the correct store
    const category = await Category.findOne({ _id: categoryId, store: storeId });
    if (!category) return res.status(404).json({ message: "Category not found in this store" });

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(categoryId, req.body, { new: true });

    res.status(200).json({ message: "Category updated successfully", category: updatedCategory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Delete a Category Under a Store
export const deleteCategory = async (req, res) => {
  try {
    const { storeId, categoryId } = req.params;

    // Check if category exists in the store
    const category = await Category.findOne({ _id: categoryId, store: storeId });
    if (!category) return res.status(404).json({ message: "Category not found in this store" });

    // Remove category from store's categories array
    await Store.findByIdAndUpdate(storeId, {
      $pull: { categories: categoryId }
    });

    // Delete category from database
    await Category.findByIdAndDelete(categoryId);

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
