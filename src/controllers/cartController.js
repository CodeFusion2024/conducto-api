import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// ➤ Add product to cart
export const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const existingItem = cart.items.find((item) => item.product.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    res.status(200).json({ message: "Product added to cart", cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Remove product from cart
export const removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();

    res.status(200).json({ message: "Product removed from cart", cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➤ Get user's cart
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
