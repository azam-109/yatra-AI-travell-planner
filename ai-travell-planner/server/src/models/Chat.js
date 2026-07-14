import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role:     { type: String, enum: ["user", "assistant", "system"], required: true },
    content:  { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true, index: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip",  index: true },   // ← NEW
    title:  { type: String, default: "New trip plan" },
    shortTermMemory: {
      destination:   String,
      origin:        String,
      departureDate: String,
      returnDate:    String,
      budget:        String,
      preferences:   [mongoose.Schema.Types.Mixed]
    },
    messages: [messageSchema]
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);