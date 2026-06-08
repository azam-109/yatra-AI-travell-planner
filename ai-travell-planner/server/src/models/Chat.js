import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New trip plan" },
    shortTermMemory: {
      destination: String,
      travelDates: String,
      budget: String,
      preferences: [{
        travelStyle: String,
        preferredBudgetCurrency: String,
        hotelPreference: String,
        foodPreference: String,
        pace: String,
        languages: [String]
      }]
    },
    messages: [messageSchema]
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
