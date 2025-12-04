import express from "express";
import multer from "multer";
import Message from "../models/Message.js";

const router = express.Router();

// ✅ Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ✅ Upload file and save as message
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { roomId, sender } = req.body;

    const newMessage = await Message.create({
      roomId,
      sender,
      fileUrl: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
    });

    res.json(newMessage);
  } catch (err) {
    res.status(500).json({ message: "File upload failed" });
  }
});

export default router;
