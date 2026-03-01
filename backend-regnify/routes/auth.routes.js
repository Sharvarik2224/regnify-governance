import express from "express";
import admin from "../config/firebaseAdmin.js";
import User from "../models/User.js";
import authenticate from "../middleware/authenticate.js";

const router = express.Router();

// 🔵 SYNC USER ROUTE
router.post("/sync-user", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    const { uid } = decoded;

    const user = await User.findOne({ firebase_uid: uid });

    if (!user) {
      return res.status(403).json({ message: "User not registered" });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "Account not activated" });
    }

    return res.json({
      message: "User authenticated",
      role: user.role,
    });

  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
});

// 🔵 HR ONLY ROUTE (Mongo Version)
router.get("/hr-only", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ firebase_uid: req.user.uid });

    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    if (user.role !== "HR") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ message: "Welcome HR" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔵 PROTECTED TEST ROUTE
router.get("/protected", authenticate, (req, res) => {
  res.json({
    message: "Access granted",
    user: req.user,
  });
});

export default router;