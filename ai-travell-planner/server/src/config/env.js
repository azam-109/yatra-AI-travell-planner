import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  groqApiKey: process.env.GROQ_API_KEY,
  tavilyApiKey: process.env.TAVILY_API_KEY,
  aviationStackApiKey: process.env.AVIATIONSTACK_API_KEY,
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
};

export function assertServerConfig() {
  const missing = ["mongodbUri", "jwtSecret", "groqApiKey"].filter((key) => !config[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
