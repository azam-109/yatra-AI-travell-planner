import VectorMemory from "../models/VectorMemory.js";
import { HashEmbeddings } from "./hashEmbeddings.js";

const embeddings = new HashEmbeddings();

export async function addVectorMemory({ userId, content, metadata = {} }) {
  const embedding = await embeddings.embedQuery(content);
  return VectorMemory.create({ userId, content, embedding, metadata });
}

export async function retrieveRelevantMemory({ userId, query, limit = 5 }) {
  const queryVector = await embeddings.embedQuery(query);

  try {
    const results = await VectorMemory.aggregate([
      {
        $vectorSearch: {
          index: "vector_memory_index",
          path: "embedding",
          queryVector,
          numCandidates: 100,
          limit,
          filter: { userId }
        }
      },
      {
        $project: {
          content: 1,
          metadata: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ]);
    return results;
  } catch (_error) {
    // Local MongoDB and fresh Atlas clusters may not have Vector Search configured yet.
    return VectorMemory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}

export { embeddings };
