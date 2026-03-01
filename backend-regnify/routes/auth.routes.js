const express = require("express");
const admin = require("../config/firebaseAdmin");
const pool = require("../config/db");
const authenticate = require("../middleware/authenticate");

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
    const { uid, email } = decoded;

    const [rows] = await pool.query(
      "SELECT role, is_active FROM users WHERE firebase_uid = ?",
      [uid]
    );

    if (!rows.length) {
      return res.status(403).json({ message: "User not registered" });
    }

    if (!rows[0].is_active) {
      return res.status(403).json({ message: "User inactive" });
    }

    // 🔥 IMPORTANT — RETURN ROLE
    return res.json({
      message: "User synced successfully",
      role: rows[0].role,
    });

  } catch (error) {
    console.error("VERIFY ERROR:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
});
router.get("/hr-only", authenticate, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT role FROM users WHERE firebase_uid = ?",
    [req.user.uid]
  );

  if (!rows.length) {
    return res.status(403).json({ message: "User not found" });
  }

  if (rows[0].role !== "HR") {
    return res.status(403).json({ message: "Access denied" });
  }

  res.json({ message: "Welcome HR" });
});

// 🔵 PROTECTED TEST ROUTE
router.get("/protected", authenticate, (req, res) => {
  res.json({
    message: "Access granted",
    user: req.user,
  });
});

module.exports = router;