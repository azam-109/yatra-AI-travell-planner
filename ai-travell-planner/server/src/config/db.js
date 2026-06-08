import mongoose from "mongoose";
import { config, assertServerConfig } from "./env.js";

export async function connectDb() {
  assertServerConfig();
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.mongodbUri, {
    autoIndex: config.nodeEnv !== "production"
  });
  console.log("MongoDB connected");
}
