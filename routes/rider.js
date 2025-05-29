import express from "express";
import Order from "../models/Order.js";
import { isRider } from "../middleware/auth.js";

const router = express.Router();

// Get rider dashboard stats
router.get("/dashboard", isRider, async (req, res) => {
  try {
    const riderId = req.userId;

    const [
      totalDeliveries,
      activeDeliveries,
      completedDeliveries,
      undelivered,
      todayDeliveries,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments({ rider: riderId }),
      Order.countDocuments({ rider: riderId, status: "shipped" }),
      Order.countDocuments({ rider: riderId, status: "delivered" }),
      Order.countDocuments({ rider: riderId, status: "undelivered" }),
      Order.countDocuments({
        rider: riderId,
        status: "delivered",
        deliveredAt: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999),
        },
      }),
      Order.find({ rider: riderId })
        .sort("-assignedAt")
        .limit(5)
        .populate("customer", "name"),
    ]);

    res.json({
      stats: {
        totalDeliveries,
        activeDeliveries,
        completedDeliveries,
        undelivered,
        todayDeliveries,
      },
      recentOrders,
    });
  } catch (error) {
    console.error("Rider dashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get assigned orders (rider only)
router.get("/orders", isRider, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date } = req.query;

    const query = { rider: req.userId };

    if (status) {
      query.status = status;
    } else {
      // By default, show only active orders (shipped)
      query.status = "shipped";
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query.assignedAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort("-assignedAt")
        .skip(skip)
        .limit(Number(limit))
        .populate("customer", "name email phone")
        .populate("items.product", "name images"),
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
    console.error("Get rider orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single order details (rider only)
router.get("/orders/:id", isRider, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      rider: req.userId,
    })
      .populate("customer", "name email phone")
      .populate("items.product", "name images");

    if (!order) {
      return res.status(404).json({
        message: "Order not found or not assigned to you",
      });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update order status (rider only - shipped to delivered/undelivered)
router.put("/orders/:id/status", isRider, async (req, res) => {
  try {
    const { status, undeliveredReason } = req.body;

    // Validate status
    if (!["delivered", "undelivered"].includes(status)) {
      return res.status(400).json({
        message: "Riders can only mark orders as delivered or undelivered",
      });
    }

    // Find order assigned to this rider
    const order = await Order.findOne({
      _id: req.params.id,
      rider: req.userId,
      status: "shipped",
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found or not in shipped status",
      });
    }

    // Update order
    order.status = status;
    if (status === "delivered") {
      order.deliveredAt = new Date();
    } else if (status === "undelivered") {
      order.deliveredAt = new Date();
      order.undeliveredReason = undeliveredReason || "Customer not available";
    }

    await order.save();

    res.json({
      message: `Order marked as ${status}`,
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get delivery history (rider only)
router.get("/history", isRider, async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const query = {
      rider: req.userId,
      status: { $in: ["delivered", "undelivered"] },
    };

    if (startDate || endDate) {
      query.deliveredAt = {};
      if (startDate) query.deliveredAt.$gte = new Date(startDate);
      if (endDate) query.deliveredAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort("-deliveredAt")
        .skip(skip)
        .limit(Number(limit))
        .select(
          "orderNumber status deliveredAt totalAmount shippingAddress customerInfo"
        ),
      Order.countDocuments(query),
    ]);

    // Calculate summary
    const summary = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      orders,
      summary: summary.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get delivery history error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get today's route (all assigned orders for today)
router.get("/today-route", isRider, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await Order.find({
      rider: req.userId,
      status: "shipped",
      assignedAt: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .sort("shippingAddress.zipCode") // Sort by zip code for route optimization
      .populate("customer", "name phone")
      .select("orderNumber shippingAddress customerInfo totalAmount items");

    res.json({
      date: today,
      totalOrders: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get today route error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
