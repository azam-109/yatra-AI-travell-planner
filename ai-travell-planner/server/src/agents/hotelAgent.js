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
  const dest        = state.tripSpec?.destination || "the destination";
  const budgetNum   = Number(state.tripSpec?.budget);
  const budgetStr   = Number.isFinite(budgetNum) && budgetNum > 0
    ? `₹${budgetNum.toLocaleString("en-IN")} total trip budget`
    : state.tripSpec?.budgetTier || "mid-range";
  const travelers   = state.tripSpec?.travelers || 1;
  const nights      = state.tripSpec?.durationDays || 3;
  const hotelRating = state.tripSpec?.hotelRating  || "";
  const ratingStr   = hotelRating ? `${hotelRating}-star` : "good quality";
  const checkIn     = state.tripSpec?.departureDate || "";
  const checkOut    = state.tripSpec?.returnDate    || "";

  let toolResult = "";
  try {
    // Include India + budget tier + rating in query to avoid irrelevant international results
    const query = [
      `best ${ratingStr} hotels in ${dest} India`,
      budgetStr,
      checkIn ? `check-in ${checkIn}` : "",
      `${travelers} guest${travelers > 1 ? "s" : ""}`,
      "price per night INR rupees booking",
      state.tripSpec?.budgetTier === "budget" ? "budget guesthouse hostel" : "",
      state.tripSpec?.budgetTier === "luxury" ? "luxury resort 5 star" : "",
    ].filter(Boolean).join(" ");

    toolResult = await hotelSearchTool.invoke({
      destination: `${dest} India`,
      budget:      budgetStr,
      preferences: query
    });
  } catch (error) {
    return { hotels: fallbackHotels({ destination: dest, toolResult, error }) };
  }

  const prompt = PromptTemplate.fromTemplate(`
You are the Hotel Agent for an Indian travel app. Your job: recommend REAL hotels in {destination}, India only.

STRICT RULES:
- ONLY recommend hotels physically located in {destination}, India.
- ALL prices MUST be in Indian Rupees (₹). Never use USD, EUR, or any other currency.
- Budget: {budgetStr} for {travelers} traveler(s), {nights} nights.
- Preferred rating: {ratingStr} hotels.
- Check-in: {checkIn} | Check-out: {checkOut}
- If the search results contain any hotels outside India, COMPLETELY IGNORE them.
- Use REAL hotel names from the search results where available.
- If no real Indian hotel names appear in results, invent plausible well-known hotel chains in {destination} (e.g. OYO, Treebo, Zostel, FabHotel, Lemon Tree, ibis).

User request:
{prompt}

Tavily hotel search results for {destination} India:
{toolResult}

Return ONLY valid JSON (no markdown, no code fences):
{{
  "hotelSummary": "2-sentence summary of hotel options in {destination}",
  "options": [
    {{
      "name": "Exact hotel name in {destination}",
      "location": "Neighbourhood or area in {destination}, e.g. Calangute, North Goa",
      "rating": "3-star / 4-star / etc.",
      "priceRange": "₹X,XXX – ₹X,XXX per night",
      "reason": "Why this suits the traveler’s budget and preferences"
    }}
  ],
  "estimatedTotal": "₹X,XXX for {nights} nights (estimated)",
  "assumptions": ["Prices are estimates; verify on Booking.com or MakeMyTrip."],
  "warnings": []
}}

Provide 3-4 hotel options covering budget to mid-range in {destination}.
`);

  const chain = RunnableSequence.from([prompt, createGroqModel({ temperature: 0.2 }), parser]);
  try {
    const hotels = await chain.invoke({
      prompt:      state.prompt,
      toolResult,
      destination: dest,
      budgetStr,
      travelers:   String(travelers),
      nights:      String(nights),
      ratingStr,
      checkIn:     checkIn  || "flexible",
      checkOut:    checkOut || "flexible",
    });
    return { hotels };
  } catch (error) {
    return { hotels: fallbackHotels({ destination: dest, toolResult, error }) };
  }
}
