import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    // Optionally fetch full user data
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

// Verify Google token
export const verifyGoogleToken = async (idToken) => {
  try {
    // Ensure we have a valid ID token
    if (!idToken || typeof idToken !== "string") {
      throw new Error("Invalid ID token provided");
    }

    // Check if the token has the correct format (should have 3 parts separated by dots)
    const tokenParts = idToken.split(".");
    if (tokenParts.length !== 3) {
      throw new Error(
        "Invalid ID token format. Please ensure you are using the Google Sign-In button."
      );
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error) {
    console.error("Google token verification error:", error.message);
    throw new Error("Invalid Google token: " + error.message);
  }
};

// Check if user is admin
export const isAdmin = async (req, res, next) => {
  try {
    await verifyToken(req, res, () => {
      if (req.userRole !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Check if user is rider
export const isRider = async (req, res, next) => {
  try {
    await verifyToken(req, res, () => {
      if (req.userRole !== "rider") {
        return res.status(403).json({ message: "Rider access required" });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Check if user is admin or rider
export const isAdminOrRider = async (req, res, next) => {
  try {
    await verifyToken(req, res, () => {
      if (req.userRole !== "admin" && req.userRole !== "rider") {
        return res
          .status(403)
          .json({ message: "Admin or Rider access required" });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Generate JWT token
export const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
