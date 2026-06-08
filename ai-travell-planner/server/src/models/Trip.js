import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    destination: { type: String, required: true },
    dates: { type: String },
    budget: { type: String },
    itinerary: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    flights: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    hotels: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    finalResponse: { type: String, required: true },
    shareId: { type: String, index: true }
  },
  { timestamps: true }
);

export default mongoose.model("Trip", tripSchema);
