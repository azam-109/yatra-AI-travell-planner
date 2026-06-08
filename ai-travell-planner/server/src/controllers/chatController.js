import { createTravelGraph } from "../graph/travelGraph.js";
import { appendMessage, getOrCreateChat } from "../memory/memoryManager.js";
import Chat from "../models/Chat.js";
import { persistTrip } from "../services/tripPersistence.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

export const listChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ userId: req.user._id })
    .sort({ updatedAt: -1 })
    .select("title shortTermMemory updatedAt createdAt messages");
  res.json({ chats });
});

export const getChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
  if (!chat) throw new ApiError(404, "Chat not found");
  res.json({ chat });
});

export const createPlan = asyncHandler(async (req, res) => {
  const { prompt, chatId, saveTrip = true } = req.body;
  if (!prompt) throw new ApiError(400, "Prompt is required");

  const chat = await getOrCreateChat({ userId: req.user._id, chatId, prompt });
  await appendMessage({ chatId: chat._id, role: "user", content: prompt });

  const graph = createTravelGraph();
  const result = await graph.invoke({
    userId: req.user._id,
    chatId: chat._id,
    prompt,
    userPreferences: JSON.stringify(req.user.preferences || {})
  });

  await appendMessage({
    chatId: chat._id,
    role: "assistant",
    content: result.finalResponse,
    metadata: { flights: result.flights, hotels: result.hotels, itinerary: result.itinerary, errors: result.errors }
  });

  let trip = null;
  let saveWarning = null;
  if (saveTrip) {
    try {
      trip = await persistTrip({
        userId: req.user._id,
        chatId: chat._id,
        result,
        finalResponse: result.finalResponse
      });
    } catch (error) {
      saveWarning = `Trip was generated but could not be saved: ${error.message}`;
    }
  }

  res.status(201).json({ chatId: chat._id, trip, saveWarning, result });
});
