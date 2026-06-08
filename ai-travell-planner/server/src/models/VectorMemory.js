import mongoose from "mongoose";

const vectorMemorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true },
    embedding: { type: [Number], required: true },
    metadata: {
      type: { type: String, default: "conversation" },
      destination: String,
      tripId: mongoose.Schema.Types.ObjectId,
      chatId: mongoose.Schema.Types.ObjectId,
      source: String
    }
  },
  { timestamps: true, collection: "vector_memories" }
);

vectorMemorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("VectorMemory", vectorMemorySchema);
