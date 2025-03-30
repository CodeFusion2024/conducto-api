import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Store from "../models/Store.js";

// ➤ Create an Order from Cart

export const buyNow = async (req, res) => {
  try {
    const { userId, productId, quantity, storeId, address } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Check stock availability
    if (product.stock < quantity)
      return res.status(400).json({ message: "Not enough stock available" });

    // Calculate total price
    const totalAmount = product.price * quantity;

    // Create order
    const order = new Order({
      user: userId,
      store: storeId,
      products: [{ product: productId, quantity }],
      totalAmount,
      address,
    });

    await order.save();

    // Reduce stock
    product.stock -= quantity;
    await product.save();

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const orderFromCart = async (req, res) => {
  try {
    const { userId, storeId, address } = req.body;

    // Fetch user's cart
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalAmount = 0;
    let orderProducts = [];

    // Check stock availability and calculate total price
    for (const item of cart.items) {
      const product = item.product;

      if (!product.store.equals(storeId)) continue; // Only process products from the given store

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}`,
        });
      }

      totalAmount += product.price * item.quantity;
      orderProducts.push({ product: product._id, quantity: item.quantity });

      // Deduct stock
      product.stock -= item.quantity;
      await product.save();
    }

    if (orderProducts.length === 0) {
      return res
        .status(400)
        .json({ message: "No products from this store in cart" });
    }

    // Create order
    const order = new Order({
      user: userId,
      store: storeId,
      products: orderProducts,
      totalAmount,
      address,
      status: "Pending",
    });

    await order.save();

    // Remove ordered items from cart
    cart.items = cart.items.filter(
      (item) => !item.product.store.equals(storeId)
    );
    await cart.save();

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get User Orders
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ user: userId }).populate(
      "products.product"
    );
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Update Order Status (Admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Allowed statuses
    const validStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    // Find order and update status
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//admin only

export const getAllOrders = async (req, res) => {
  try {
    // Fetch all orders with user and store details
    const orders = await Order.find()
      .populate("user", "name email") // Fetch user details
      .populate("products.product", "name price images") // Fetch product details
      .populate("store", "name address") // Fetch store details
      .sort({ createdAt: -1 }); // Sort by latest order

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.body; // Get user ID from request body

    // Find order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Check if the order belongs to the user
    if (order.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You can only cancel your own orders" });
    }

    // Check if order can be canceled based on delivery status
    if (["Shipped", "Delivered"].includes(order.status)) {
      return res
        .status(400)
        .json({ message: "Order cannot be canceled at this stage" });
    }

    // Update order status to "Cancelled"
    order.status = "Cancelled";
    await order.save();

    res.status(200).json({ message: "Order canceled successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order
    const order = await Order.findById(orderId)
      .populate("user", "name email") // Get user details
      .populate("products.product", "name price"); // Get product details

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Order details fetched successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserOrderHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all orders for the user
    const orders = await Order.find({ user: userId })
      .populate("products.product", "name price")
      .sort({ createdAt: -1 }); // Sort by latest orders first

    if (!orders.length) {
      return res.status(404).json({ message: "No order history found" });
    }

    res.status(200).json({
      message: "Order history fetched successfully",
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminDashboardData = async (req, res) => {
  try {
    // Get total number of orders
    const totalOrders = await Order.countDocuments();

    // Get total revenue (sum of all order amounts)
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    // Get order count by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      totalOrders,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      ordersByStatus,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
