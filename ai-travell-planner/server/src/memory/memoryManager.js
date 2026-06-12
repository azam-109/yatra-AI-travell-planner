import Chat from "../models/Chat.js";
import { addVectorMemory, retrieveRelevantMemory } from "./vectorStore.js";

export async function getOrCreateChat({ userId, chatId, prompt }) {
  if (chatId) {
    const existing = await Chat.findOne({ _id: chatId, userId });
    if (existing) return existing;
  }

  return Chat.create({
    userId,
    title: prompt.slice(0, 80),
    messages: []
  });
}

export async function appendMessage({ chatId, role, content, metadata }) {
  return Chat.findByIdAndUpdate(
    chatId,
    { $push: { messages: { role, content, metadata } } },
    { new: true }
  );
}

export async function updateShortTermMemory({ chatId, patch }) {
    // Build a $set that only touches the keys present in patch
  const setFields = {};
  for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined && value !== null) {
      setFields[`shortTermMemory.${key}`] = value;
    }
  }
  return Chat.findByIdAndUpdate(chatId, { $set: setFields }, { new: true });
}

export async function rememberConversation({ userId, chatId, content, metadata = {} }) {
  if (!content || content.length < 20) return null;
  return addVectorMemory({
    userId,
    content,
    metadata: { ...metadata, chatId, type: metadata.type || "conversation" }
  });
}

export async function getContextualMemory({ userId, query }) {
  const memories = await retrieveRelevantMemory({ userId, query });
  return memories.map((memory) => memory.content).join("\n---\n");
}
