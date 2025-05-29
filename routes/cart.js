import express from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Get user's cart
router.get("/", verifyToken, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId }).populate(
      "items.product",
      "name images basePrice isActive"
    );

    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
      await cart.save();
    }

    // Filter out items with inactive products
    const activeItems = cart.items.filter((item) => item.product?.isActive);
    if (activeItems.length !== cart.items.length) {
      cart.items = activeItems;
      await cart.save();
    }

    res.json({
      cart,
      summary: {
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
      },
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add item to cart
router.post("/add", verifyToken, async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;

    if (!productId || !variantId) {
      return res.status(400).json({
        message: "Product ID and variant ID are required",
      });
    }

    // Verify product and variant exist
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found or inactive" });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    // Check stock
    if (variant.stock < quantity) {
      return res.status(400).json({
        message: `Only ${variant.stock} items available in stock`,
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.variant.variantId.toString() === variantId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      // Check stock for total quantity
      if (variant.stock < newQuantity) {
        return res.status(400).json({
          message: `Cannot add more. Only ${variant.stock} items available in stock`,
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        variant: {
          variantId: variant._id,
          color: variant.color,
          size: variant.size,
          price: variant.price,
        },
        quantity,
      });
    }

    await cart.save();

    // Populate for response
    await cart.populate("items.product", "name images basePrice");

    res.json({
      message: "Item added to cart",
      cart,
      summary: {
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
      },
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update cart item quantity
router.put("/items/:itemId", verifyToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    if (quantity < 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    if (quantity === 0) {
      // Remove item
      cart.items.pull(itemId);
    } else {
      // Check stock
      const product = await Product.findById(item.product);
      const variant = product.variants.id(item.variant.variantId);

      if (variant.stock < quantity) {
        return res.status(400).json({
          message: `Only ${variant.stock} items available in stock`,
        });
      }

      item.quantity = quantity;
    }

    await cart.save();
    await cart.populate("items.product", "name images basePrice");

    res.json({
      message: "Cart updated",
      cart,
      summary: {
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
      },
    });
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove item from cart
router.delete("/items/:itemId", verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items.pull(req.params.itemId);
    await cart.save();
    await cart.populate("items.product", "name images basePrice");

    res.json({
      message: "Item removed from cart",
      cart,
      summary: {
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
      },
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Clear cart
router.delete("/clear", verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    res.json({
      message: "Cart cleared",
      cart,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Validate cart items (check stock and prices)
router.post("/validate", verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.json({ valid: true, issues: [] });
    }

    const issues = [];
    const updatedItems = [];

    for (const item of cart.items) {
      const product = item.product;

      if (!product || !product.isActive) {
        issues.push({
          itemId: item._id,
          type: "removed",
          message: "Product is no longer available",
        });
        continue;
      }

      const variant = product.variants.id(item.variant.variantId);
      if (!variant) {
        issues.push({
          itemId: item._id,
          type: "removed",
          message: "Variant is no longer available",
        });
        continue;
      }

      // Check stock
      if (variant.stock < item.quantity) {
        issues.push({
          itemId: item._id,
          type: "stock",
          message: `Only ${variant.stock} items available`,
          availableStock: variant.stock,
        });
        item.quantity = variant.stock;
      }

      // Check price changes
      if (variant.price !== item.variant.price) {
        issues.push({
          itemId: item._id,
          type: "price",
          message: "Price has changed",
          oldPrice: item.variant.price,
          newPrice: variant.price,
        });
        item.variant.price = variant.price;
      }

      if (variant.stock > 0) {
        updatedItems.push(item);
      }
    }

    // Update cart if there are issues
    if (issues.length > 0) {
      cart.items = updatedItems;
      await cart.save();
    }

    res.json({
      valid: issues.length === 0,
      issues,
      cart: issues.length > 0 ? cart : undefined,
    });
  } catch (error) {
    console.error("Validate cart error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
