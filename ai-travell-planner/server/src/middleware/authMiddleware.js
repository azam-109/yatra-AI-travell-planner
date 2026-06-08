import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { config } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new ApiError(401, "Authentication required");

  const decoded = jwt.verify(token, config.jwtSecret);
  const user = await User.findById(decoded.id).select("-password");
  if (!user) throw new ApiError(401, "User no longer exists");

  req.user = user;
  next();
});
