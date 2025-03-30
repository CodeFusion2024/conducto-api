import express from "express";
import { 
  createCategory, 
  getCategoriesByStore, 
  updateCategory, 
  deleteCategory 
} from "../controllers/categoryController.js";

const router = express.Router();

// Create Category Under a Store
router.post("/create", createCategory);

// Get All Categories Under a Store
router.get("/:storeId/all", getCategoriesByStore);

// Update a Category Under a Store
router.put("/:storeId/:categoryId", updateCategory);

// Delete a Category Under a Store
router.delete("/:storeId/:categoryId", deleteCategory);

export default router;
