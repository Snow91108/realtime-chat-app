import express from "express";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// This route is protected
router.get("/dashboard", protect, (req, res) => {
  res.status(200).json({
    message: "Welcome! You are authorized",
    userId: req.userId,
  });
});

export default router;
