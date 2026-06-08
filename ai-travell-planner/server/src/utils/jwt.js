import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export function signToken(user) {
  return jwt.sign({ id: user._id.toString() }, config.jwtSecret, { expiresIn: "7d" });
}
