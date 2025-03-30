import express from "express";
import { addToCart, removeFromCart, getCart } from "../controllers/cartController.js";

const router = express.Router();

router.post("/add", addToCart);
router.post("/remove", removeFromCart);
router.get("/:userId", getCart);

export default router;
