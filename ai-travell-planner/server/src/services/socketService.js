import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { config } from "../config/env.js";
import { createTravelGraph } from "../graph/travelGraph.js";
import { appendMessage, getOrCreateChat } from "../memory/memoryManager.js";
import { persistTrip } from "./tripPersistence.js";
import Chat from "../models/Chat.js";
import { z } from "zod";

const travelPlanSchema = z.object({
  prompt: z
    .string()
    .min(10, "Please describe your trip in at least 10 characters.")
    .max(2000),
  chatId: z.string().optional().nullable(),
  saveTrip: z.boolean().default(true),
});

export function registerTravelSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) return next(new Error("Missing token"));

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) return next(new Error("Invalid token"));

      socket.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on("connection", (socket) => {
    socket.on("travel:plan", async ({ prompt, chatId, tripSpec, saveTrip = true } = {}) => {
      try {

        if (!prompt && !tripSpec) throw new Error("prompt or tripSpec is required");

        const chat = await getOrCreateChat({ userId: socket.user._id, chatId, prompt: prompt || `Trip to ${tripSpec?.destination}` });

        await appendMessage({ chatId: chat._id, role: "user", content: prompt || `Plan my trip to ${tripSpec?.destination}` });

        socket.emit("travel:started", {
          chatId: chat._id,
        });

        let streamed = "";

        const callbacks = [
          {
            handleLLMNewToken(token) {
              streamed += token;
              socket.emit("travel:token", { token });
            },
          },
        ];

        // Load previous conversation
        const chatWithMessages = await Chat.findById(chat._id)
          .select("messages")
          .lean();

        const conversationHistory = (
          chatWithMessages?.messages || []
        )
          .slice(-10)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const graph = createTravelGraph();

        const result = await graph.invoke(
          {
            userId: socket.user._id,
            chatId: chat._id,
            prompt: prompt || `Plan a complete trip from ${tripSpec?.origin} to ${tripSpec?.destination}`,
            tripSpec:    tripSpec || null, 
            userPreferences: socket.user.preferences || {},
          },
          {
            configurable: { callbacks },
          }
        );

        const finalResponse = result.finalResponse || streamed;

        await appendMessage({
          chatId: chat._id,
          role: "assistant",
          content: finalResponse,
          metadata: {
            flights: result.flights,
            hotels: result.hotels,
            itinerary: result.itinerary,
            errors: result.errors,
          },
        });

        let trip = null;
        let saveWarning = null;

        if (saveTrip) {
          try {
            trip = await persistTrip({
              userId: socket.user._id,
              chatId: chat._id,
              result,
              finalResponse,
            });
          } catch (error) {
            saveWarning = `Trip was generated but could not be saved: ${error.message}`;
          }
        }

        socket.emit("travel:complete", {
          chatId: chat._id,
          trip,
          saveWarning,
          result: {
            ...result,
            finalResponse,
          },
        });
      } catch (error) {
        socket.emit("travel:error", {
          message: error.message || "Planning failed",
        });
      }
    });
  });
}