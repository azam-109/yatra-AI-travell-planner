import { ChatGroq } from "@langchain/groq";
import { config } from "./env.js";

export function createGroqModel({ temperature = 0.4, streaming = false, callbacks = [] } = {}) {
  return new ChatGroq({
    apiKey: config.groqApiKey,
    model: "llama-3.3-70b-versatile",
    temperature,
    streaming,
    callbacks
  });
}
