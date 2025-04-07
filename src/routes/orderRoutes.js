import express from "express";
import {
  buyNow,
  orderFromCart,
  getUserOrders,
  updateOrderStatus,
  getAllOrders,
  cancelOrder,
  trackOrder,
  getUserOrderHistory,
  getAdminDashboardData,
} from "../controllers/orderController.js";

const router = express.Router();

router.get("/:userId", getUserOrders);
router.put("/:orderId/status", updateOrderStatus);
router.post("/buy-now", buyNow);
router.post("/from-cart", orderFromCart);

router.put("/:orderId/cancel", cancelOrder);
router.get("/:orderId/track", trackOrder);
router.get("/user/:userId/history", getUserOrderHistory);
router.get("/dashboard", getAdminDashboardData);


//admin only

router.get("/all", getAllOrders);

export default router;
