import express from "express";
import { createProduct, getProductsByCategory, addReview, getProductWithReviews } from "../controllers/productController.js";

const router = express.Router();

router.post("/create", createProduct);
router.get("/:categoryId", getProductsByCategory);
router.post("/:productId/reviews", addReview);
router.get("/:productId/reviews/all", getProductWithReviews);

export default router;
