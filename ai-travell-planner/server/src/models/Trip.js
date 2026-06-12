import mongoose from "mongoose";

const tripSpecSchema = new mongoose.Schema(
  {
    origin:             { type: String },
    destination:        { type: String },
    departureDate:      { type: String },
    returnDate:         { type: String },
    durationDays:       { type: Number },
    budget:             { type: Number },
    budgetTier:         { type: String, enum: ["budget", "mid-range", "luxury"], default: "mid-range" },
    travelers:          { type: Number, default: 1 },
    travelStyle:        { type: String, enum: ["solo", "couple", "family", "friends"], default: "solo" },
    interests:          [{ type: String }],
    hotelType:          { type: String },
    flightClass:        { type: String, enum: ["economy", "business", "first"], default: "economy" },
    preferredAirlines:  [{ type: String }],
    hotelRating:        { type: Number, min: 1, max: 5 },
    dietary:            { type: String },
    specialRequirements:{ type: String }
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    chatId:      { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    tripSpec:    { type: tripSpecSchema },

    // Flat fields kept for dashboard display + backward compat
    destination: { type: String, required: true },
    dates:       { type: String },
    budget:      { type: String },

    // Agent outputs — all optional at creation, filled after graph runs
    itinerary:     { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    flights:       { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    hotels:        { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    finalResponse: { type: String, default: "" },   // NOT required — filled after agents run

    // Modification history
    tripVersion:         { type: Number, default: 1 },
    modificationHistory: [
      {
        version:       Number,
        changedFields: [String],
        timestamp:     { type: Date, default: Date.now }
      }
    ],

    shareId: { type: String, index: true }
  },
  { timestamps: true }
);

export default mongoose.model("Trip", tripSchema);