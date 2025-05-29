import express from "express";
import User from "../models/User.js";
import ApprovedEmail from "../models/ApprovedEmail.js";
import {
  verifyGoogleToken,
  generateToken,
  verifyToken,
} from "../middleware/auth.js";

const router = express.Router();

// Google Sign In
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "ID token is required" });
    }

    // Verify Google token
    const googleUser = await verifyGoogleToken(idToken);

    // Check if email is approved
    const approvedEmail = await ApprovedEmail.findOne({
      email: googleUser.email.toLowerCase(),
    });

    if (!approvedEmail) {
      return res.status(403).json({
        message:
          "Your email is not authorized to access this platform. Please contact the administrator.",
      });
    }

    // Find or create user
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      user = new User({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.googleId,
        picture: googleUser.picture,
        role: approvedEmail.role,
      });
      await user.save();
    } else {
      // Update user info
      user.name = googleUser.name;
      user.picture = googleUser.picture;
      user.googleId = googleUser.googleId;
      if (user.role !== approvedEmail.role) {
        user.role = approvedEmail.role;
      }
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error("Google sign in error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
});

// Get current user
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-__v");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout (optional - mainly for client-side token removal)
router.post("/logout", verifyToken, (req, res) => {
  // In a JWT-based system, logout is typically handled client-side
  // by removing the token from storage
  res.json({ message: "Logged out successfully" });
});

// Check if email is approved (public endpoint)
router.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const approvedEmail = await ApprovedEmail.findOne({
      email: email.toLowerCase(),
    });

    res.json({
      isApproved: !!approvedEmail,
      role: approvedEmail?.role,
    });
  } catch (error) {
    console.error("Check email error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
