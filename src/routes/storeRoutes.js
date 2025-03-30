import express from "express";
import { createStore, getStores, getNearbyStores, updateStore, deleteStore , addReview, getStoreWithReviews } from "../controllers/storeController.js";

const router = express.Router();

router.post("/", createStore);
router.get("/", getStores);
router.get("/nearby", getNearbyStores);
router.put("/:storeId", updateStore);
router.delete("/:storeId", deleteStore);
router.post("/:storeId/reviews", addReview);
router.get("/:storeId", getStoreWithReviews);


export default router;
