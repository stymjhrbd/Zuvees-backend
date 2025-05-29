import express from "express";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import ApprovedEmail from "../models/ApprovedEmail.js";
import { isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Get dashboard stats (admin only)
router.get("/dashboard", isAdmin, async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "delivered" }),
      Order.aggregate([
        { $match: { status: { $in: ["paid", "shipped", "delivered"] } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      User.countDocuments({ role: "customer" }),
      Product.countDocuments({ isActive: true }),
      Order.find()
        .sort("-createdAt")
        .limit(5)
        .populate("customer", "name email"),
    ]);

    res.json({
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalCustomers,
        totalProducts,
      },
      recentOrders,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all orders (admin only)
router.get("/orders", isAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate,
      riderId,
    } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (riderId) {
      query.rider = riderId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "customerInfo.name": { $regex: search, $options: "i" } },
        { "customerInfo.email": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort("-createdAt")
        .skip(skip)
        .limit(Number(limit))
        .populate("customer", "name email")
        .populate("rider", "name email"),
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
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update order status and assign rider (admin only)
router.put("/orders/:id/status", isAdmin, async (req, res) => {
  try {
    const { status, riderId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Validate status transition
    const validTransitions = {
      pending: ["paid", "cancelled"],
      paid: ["processing", "shipped", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered", "undelivered"],
      delivered: [],
      undelivered: ["shipped"],
      cancelled: [],
      refunded: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${order.status} to ${status}`,
      });
    }

    // If changing to shipped, rider is required
    if (status === "shipped" && !riderId) {
      return res
        .status(400)
        .json({ message: "Rider must be assigned for shipping" });
    }

    // Verify rider exists and is active
    if (riderId) {
      const rider = await User.findOne({
        _id: riderId,
        role: "rider",
        isActive: true,
      });

      if (!rider) {
        return res.status(404).json({ message: "Valid rider not found" });
      }
    }

    // Update order
    await order.updateStatus(status, riderId);

    res.json({
      message: "Order status updated successfully",
      order: await Order.findById(order._id)
        .populate("customer", "name email")
        .populate("rider", "name email"),
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all riders (admin only)
router.get("/riders", isAdmin, async (req, res) => {
  try {
    const riders = await User.find({ role: "rider" }).select(
      "name email phone isActive createdAt"
    );

    // Get order stats for each rider
    const ridersWithStats = await Promise.all(
      riders.map(async (rider) => {
        const [totalOrders, activeOrders] = await Promise.all([
          Order.countDocuments({ rider: rider._id }),
          Order.countDocuments({
            rider: rider._id,
            status: "shipped",
          }),
        ]);

        return {
          ...rider.toObject(),
          stats: {
            totalOrders,
            activeOrders,
          },
        };
      })
    );

    res.json(ridersWithStats);
  } catch (error) {
    console.error("Get riders error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Manage approved emails (admin only)
router.get("/approved-emails", isAdmin, async (req, res) => {
  try {
    const emails = await ApprovedEmail.find()
      .sort("-createdAt")
      .populate("addedBy", "name email");

    res.json(emails);
  } catch (error) {
    console.error("Get approved emails error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add approved email (admin only)
router.post("/approved-emails", isAdmin, async (req, res) => {
  try {
    const { email, role = "customer", notes } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if already exists
    const existing = await ApprovedEmail.findOne({
      email: email.toLowerCase(),
    });

    if (existing) {
      return res.status(400).json({ message: "Email already approved" });
    }

    const approvedEmail = new ApprovedEmail({
      email: email.toLowerCase(),
      role,
      notes,
      addedBy: req.userId,
    });

    await approvedEmail.save();

    res.status(201).json({
      message: "Email approved successfully",
      approvedEmail,
    });
  } catch (error) {
    console.error("Add approved email error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove approved email (admin only)
router.delete("/approved-emails/:id", isAdmin, async (req, res) => {
  try {
    const email = await ApprovedEmail.findByIdAndDelete(req.params.id);

    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }

    res.json({ message: "Email removed successfully" });
  } catch (error) {
    console.error("Remove approved email error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get users (admin only)
router.get("/users", isAdmin, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort("-createdAt")
        .skip(skip)
        .limit(Number(limit))
        .select("-googleId"),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle user active status (admin only)
router.put("/users/:id/toggle-active", isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
      user,
    });
  } catch (error) {
    console.error("Toggle user active error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
