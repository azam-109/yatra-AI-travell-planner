import axios from "axios";
import { config } from "../config/env.js";
import { withRetry } from "../utils/retry.js";

export async function tavilySearch(query, { maxResults = 6 } = {}) {
  if (!config.tavilyApiKey) {
    return {
      source: "mock",
      results: [
        {
          title: "Configure Tavily for live hotel and travel search",
          url: "https://tavily.com",
          content: `Placeholder result for: ${query}`
        }
      ]
    };
  }

  return withRetry(
    async () => {
      const { data } = await axios.post(
        "https://api.tavily.com/search",
        {
          api_key: config.tavilyApiKey,
          query,
          search_depth: "advanced",
          include_answer: true,
          max_results: maxResults
        },
        { timeout: 15000 }
      );
      return { source: "tavily", answer: data.answer, results: data.results || [] };
    },
    { label: "Tavily travel search" }
  );
}
