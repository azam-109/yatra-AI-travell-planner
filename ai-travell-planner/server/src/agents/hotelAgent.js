import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createGroqModel } from "../config/llm.js";
import { tavilySearch } from "../services/tavilyService.js";

const hotelSearchTool = new DynamicStructuredTool({
  name: "search_hotels",
  description: "Search hotels and accommodation options using Tavily.",
  schema: z.object({
    destination: z.string(),
    budget: z.string().optional(),
    preferences: z.string().optional()
  }),
  func: async ({ destination, budget, preferences }) => {
    const query = `Best hotels in ${destination} for ${budget || "a flexible budget"} ${preferences || ""} ratings prices neighborhoods`;
    return JSON.stringify(await tavilySearch(query));
  }
});

const parser = new JsonOutputParser();

function parseToolResult(toolResult) {
  try {
    return JSON.parse(toolResult);
  } catch {
    return { source: "unknown", results: [] };
  }
}

function fallbackHotels({ destination, toolResult, error }) {
  const parsed = parseToolResult(toolResult);
  const searchResults = parsed.results || [];
  const options = searchResults.slice(0, 6).map((result) => ({
    name: result.title,
    location: destination,
    rating: "Check latest rating on booking site",
    priceRange: "Check live price",
    url: result.url,
    reason: result.content?.slice(0, 220) || "Relevant Tavily hotel result for this destination."
  }));

  if (!options.length) {
    options.push(
      {
        name: `${destination} central mid-range hotel`,
        location: "Near main rail/subway hub",
        rating: "Use live booking site rating",
        priceRange: "Mid-range",
        reason: "Good default base for first-time visitors when live hotel search is unavailable."
      },
      {
        name: `${destination} budget guesthouse or hostel`,
        location: "Well-connected neighborhood",
        rating: "Use live booking site rating",
        priceRange: "Budget",
        reason: "Keeps the trip under budget while preserving access to major sights."
      }
    );
  }

  return {
    hotelSummary: error
      ? `Hotel search fallback used because live processing failed: ${error.message}`
      : "Hotel options were built from Tavily search results.",
    options,
    estimatedTotal: "Confirm live rates before booking",
    assumptions: ["Prices and availability change quickly.", "Use Booking.com, Agoda, Google Hotels, or hotel websites to verify rates."],
    warnings: error ? [error.message] : []
  };
}

export async function runHotelAgent(state) {
  let toolResult = "";
  try {
    toolResult = await hotelSearchTool.invoke({
      destination: state.tripSpec.destination,
      budget: state.tripSpec.budget,
      preferences:
        typeof state.userPreferences === "object"
        ? JSON.stringify(state.userPreferences)
        : state.userPreferences
    });
  } catch (error) {
    return { hotels: fallbackHotels({ destination: state.tripSpec.destination, toolResult, error }) };
  }

  const prompt = PromptTemplate.fromTemplate(`
You are the Hotel Agent. Convert search results into bookable-style recommendations.

User request:
{prompt}

Hotel search output:
{toolResult}

Return strict JSON with:
hotelSummary, options[] with name/location/rating/priceRange/reason, estimatedTotal, assumptions[], warnings[].
`);

  const chain = RunnableSequence.from([prompt, createGroqModel({ temperature: 0.25 }), parser]);
  try {
    const hotels = await chain.invoke({ prompt: state.prompt, toolResult });
    return { hotels };
  } catch (error) {
    return { hotels: fallbackHotels({ destination: state.tripSpec.destination, toolResult, error }) };
  }
}
