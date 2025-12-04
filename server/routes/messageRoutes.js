import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

// GET /api/messages/:roomId  → chat history for that room
router.get("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Get messages error:", error.message);
    res.status(500).json({ message: "Failed to load messages" });
  }
});

export default router;
