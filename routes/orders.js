import express from "express";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Create order (authenticated)
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      customerInfo,
      paymentMethod = "card",
    } = req.body;

    // Validate request
    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Order must have at least one item" });
    }

    if (!shippingAddress || !customerInfo) {
      return res
        .status(400)
        .json({ message: "Shipping address and customer info are required" });
    }

    // Validate and prepare order items
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${item.productId} not found` });
      }

      const variant = product.variants.id(item.variantId);
      if (!variant) {
        return res
          .status(404)
          .json({ message: `Variant not found for product ${product.name}` });
      }

      // Check stock
      if (variant.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name} - ${variant.color} ${variant.size}. Only ${variant.stock} available.`,
        });
      }

      const itemSubtotal = variant.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product: product._id,
        productName: product.name,
        productImage: product.images[0],
        variant: {
          variantId: variant._id,
          color: variant.color,
          size: variant.size,
          price: variant.price,
          sku: variant.sku,
        },
        quantity: item.quantity,
        price: variant.price,
        subtotal: itemSubtotal,
      });
    }

    // Calculate totals
    const tax = subtotal * 0.08; // 8% tax
    const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const totalAmount = subtotal + tax + shippingCost;

    // Create order
    const order = new Order({
      customer: req.userId,
      customerInfo: {
        name: customerInfo.name || req.user.name,
        email: customerInfo.email || req.user.email,
        phone: customerInfo.phone || req.user.phone,
      },
      shippingAddress,
      items: orderItems,
      subtotal,
      tax,
      shippingCost,
      totalAmount,
      status: "pending",
      paymentInfo: {
        method: paymentMethod,
      },
    });

    await order.save();

    // Update product stock
    for (const item of items) {
      await Product.findOneAndUpdate(
        {
          _id: item.productId,
          "variants._id": item.variantId,
        },
        {
          $inc: { "variants.$.stock": -item.quantity },
        }
      );
    }

    // Clear user's cart
    await Cart.findOneAndUpdate({ user: req.userId }, { $set: { items: [] } });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's orders (authenticated)
router.get("/my-orders", verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { customer: req.userId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort("-createdAt")
        .skip(skip)
        .limit(Number(limit))
        .populate("rider", "name email phone"),
      Order.countDocuments(query),
    ]);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single order (authenticated)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("rider", "name email phone")
      .populate("items.product", "name images");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns this order or is admin/rider
    if (
      order.customer._id.toString() !== req.userId &&
      req.userRole !== "admin" &&
      req.userRole !== "rider"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update order payment status (simulate payment)
router.post("/:id/pay", verifyToken, async (req, res) => {
  try {
    const { transactionId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns this order
    if (order.customer.toString() !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Order is already paid or processed" });
    }

    // Update order status
    order.status = "paid";
    order.paymentInfo.transactionId = transactionId || "MOCK-" + Date.now();
    order.paymentInfo.paidAt = new Date();

    await order.save();

    res.json({
      message: "Payment successful",
      order,
    });
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel order (authenticated)
router.post("/:id/cancel", verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns this order
    if (order.customer.toString() !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if order can be cancelled
    if (!["pending", "paid"].includes(order.status)) {
      return res.status(400).json({
        message: "Order cannot be cancelled at this stage",
      });
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findOneAndUpdate(
        {
          _id: item.product,
          "variants._id": item.variant.variantId,
        },
        {
          $inc: { "variants.$.stock": item.quantity },
        }
      );
    }

    // Update order status
    order.status = "cancelled";
    await order.save();

    res.json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Track order (public with order number)
router.get("/track/:orderNumber", async (req, res) => {
  try {
    const order = await Order.findOne({
      orderNumber: req.params.orderNumber,
    })
      .select(
        "orderNumber status createdAt shippedAt deliveredAt trackingNumber"
      )
      .populate("rider", "name");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Track order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
