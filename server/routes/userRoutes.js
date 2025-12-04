import express from "express";
import User from "../models/User.js";

const router = express.Router();

// ✅ Get all users (except password)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

export default router;
