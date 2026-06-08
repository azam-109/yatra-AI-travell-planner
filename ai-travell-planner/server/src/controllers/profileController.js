import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const updates = {
    name: req.body.name ?? req.user.name,
    preferences: {
      ...req.user.preferences?.toObject?.(),
      ...req.body.preferences
    }
  };

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true
  }).select("-password");

  res.json({ user });
});
