import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

import Message from "./models/Message.js";
import Call from "./models/Call.js"; // ✅ Call model

import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static("uploads"));

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// ✅ ONLINE USERS MAP (userId -> socketId)
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // ==========================
  // ✅ USER ONLINE
  // ==========================
  socket.on("userOnline", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  // ==========================
  // ✅ JOIN PRIVATE ROOM
  // ==========================
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
  });

  // ==========================
  // ✅ SEND PRIVATE MESSAGE
  // ==========================
  socket.on("sendMessage", async ({ roomId, messageData }) => {
    try {
      const saved = await Message.create({
        roomId,
        sender: messageData.sender,
        text: messageData.text,
        fileUrl: messageData.fileUrl || null,
        fileType: messageData.fileType || null,
        status: "sent",
      });

      io.to(roomId).emit("receiveMessage", {
        ...saved._doc,
        status: "delivered",
      });

      await Message.findByIdAndUpdate(saved._id, {
        status: "delivered",
      });
    } catch (err) {
      console.error("Message save error:", err.message);
    }
  });

  // ==========================
  // ✅ MARK MESSAGES AS SEEN
  // ==========================
  socket.on("markSeen", async ({ roomId, viewerName }) => {
    try {
      await Message.updateMany(
        {
          roomId,
          sender: { $ne: viewerName },
          status: "delivered",
        },
        { status: "seen" }
      );

      io.to(roomId).emit("messagesSeen");
    } catch (err) {
      console.error("Seen update error:", err.message);
    }
  });

  // ==========================
  // ✅ TYPING INDICATOR
  // ==========================
  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName);
  });

  socket.on("stopTyping", ({ roomId }) => {
    socket.to(roomId).emit("userStoppedTyping");
  });

  // ==========================
  // ✅ ✅ PRIVATE CALL SIGNALING ✅ FIXED ✅
  // ==========================

  // ✅ START CALL
  socket.on("callUser", async ({ to, signalData, from, name, callType }) => {
    try {
      const receiverSocketId = onlineUsers.get(to); // ✅ USER ID → SOCKET ID

      if (!receiverSocketId) {
        console.log("❌ Receiver not online:", to);
        return;
      }

      const newCall = await Call.create({
        from,
        to,
        callType,
        status: "started",
      });

      io.to(receiverSocketId).emit("incomingCall", {
        signal: signalData,
        from,
        name,
        callType,
        callId: newCall._id,
      });
    } catch (err) {
      console.error("Call start error:", err.message);
    }
  });

  // ✅ ANSWER CALL
  socket.on("answerCall", async ({ to, signal, callId }) => {
    try {
      const callerSocketId = onlineUsers.get(to); // ✅ USER ID → SOCKET ID

      if (!callerSocketId) {
        console.log("❌ Caller socket not found:", to);
        return;
      }

      await Call.findByIdAndUpdate(callId, { status: "connected" });

      io.to(callerSocketId).emit("callAccepted", {
        signal,
        callId,
      });
    } catch (err) {
      console.error("Call answer error:", err.message);
    }
  });

  // ✅ END CALL
  socket.on("endCall", async ({ callId, to }) => {
    try {
      const otherSocket = onlineUsers.get(to);

      if (otherSocket) {
        io.to(otherSocket).emit("callEnded");
      }

      await Call.findByIdAndUpdate(callId, {
        status: "ended",
        endedAt: new Date(),
      });
    } catch (err) {
      console.error("Call end error:", err.message);
    }
  });

  // ==========================
  // ✅ DISCONNECT
  // ==========================
  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }

    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    console.log("❌ User disconnected:", socket.id);
  });
});

// ==========================
// ✅ DATABASE + SERVER START
// ==========================
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("✅ MongoDB connected");

  httpServer.listen(5000, () => {
    console.log("✅ Server running on port 5000");
  });
});
