import User from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signToken } from "../utils/jwt.js";

function authPayload(user) {
  return {
    token: signToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences
    }
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new ApiError(400, "Name, email, and password are required");
  if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

  const exists = await User.exists({ email });
  if (exists) throw new ApiError(409, "Email is already registered");

  const user = await User.create({ name, email, password });
  res.status(201).json(authPayload(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  res.json(authPayload(user));
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
