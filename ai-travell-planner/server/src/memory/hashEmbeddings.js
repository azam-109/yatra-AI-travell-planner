import { Embeddings } from "@langchain/core/embeddings";

export class HashEmbeddings extends Embeddings {
  constructor({ dimensions = 384 } = {}) {
    super({});
    this.dimensions = dimensions;
  }

  async embedDocuments(texts) {
    return texts.map((text) => this.embedText(text));
  }

  async embedQuery(text) {
    return this.embedText(text);
  }

  embedText(text) {
    const vector = Array.from({ length: this.dimensions }, () => 0);
    const tokens = String(text).toLowerCase().match(/[a-z0-9]+/g) || [];
    for (const token of tokens) {
      let hash = 2166136261;
      for (let i = 0; i < token.length; i += 1) {
        hash ^= token.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      const index = Math.abs(hash) % this.dimensions;
      vector[index] += 1;
    }
    const norm = Math.hypot(...vector) || 1;
    return vector.map((value) => value / norm);
  }
}
