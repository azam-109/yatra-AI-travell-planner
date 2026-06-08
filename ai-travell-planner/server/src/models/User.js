import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const preferenceSchema = new mongoose.Schema(
  {
    travelStyle: { type: String, default: "balanced" },
    preferredBudgetCurrency: { type: String, default: "INR" },
    hotelPreference: { type: String, default: "comfortable mid-range" },
    foodPreference: { type: String, default: "local cuisine" },
    pace: { type: String, default: "moderate" },
    languages: [{ type: String }]
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    preferences: { type: preferenceSchema, default: () => ({}) }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
