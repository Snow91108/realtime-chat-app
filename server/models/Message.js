import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true },
    sender: { type: String, required: true },

    text: { type: String },

    // ✅ NEW FOR FILE UPLOAD
    fileUrl: { type: String },
    fileType: { type: String }, // image, pdf, etc

    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
