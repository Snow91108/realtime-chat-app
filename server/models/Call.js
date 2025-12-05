import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    from: String,
    to: String,
    callType: {
      type: String,
      enum: ["audio", "video"],
    },
    status: {
      type: String,
      enum: ["started", "connected", "ended"],
      default: "started",
    },
    endedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Call", callSchema);
