import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { createGroqModel } from "../config/llm.js";
import { tavilySearch } from "../services/tavilyService.js";
import { getWeatherContext } from "../services/weatherService.js";
import { logger } from "../utils/logger.js";

const LABEL = "itineraryAgent";
const parser = new JsonOutputParser();

function formatBudget(budget) {
  if (!budget) return "flexible budget";
  const num = Number(String(budget).replace(/[^0-9.]/g, ""));
  return isNaN(num) || num === 0 ? "flexible budget" : `₹${num.toLocaleString("en-IN")} total`;
}

function fallbackItinerary(state, travelSearch = {}, weather = null, error = null) {
  const dest        = state.tripSpec?.destination || "the destination";
  const durationDays = state.tripSpec?.durationDays || 5;

  const dailyPlan = Array.from({ length: durationDays }, (_, i) => ({
    day:         i + 1,
    theme:       `Day ${i + 1} in ${dest}`,
    morning:     "Visit a major landmark or neighbourhood.",
    afternoon:   "Explore a local market, temple, or cultural site.",
    evening:     "Try local street food and evening walk.",
    food:        `Local cuisine in ${dest}`,
    transport:   "Auto-rickshaw or local bus",
    budgetNotes: "₹500–₹1,000 per day excluding accommodation"
  }));

  return {
    destination: dest,
    durationDays,
    dailyPlan,
    budgetBreakdown: {
      flights:     "Depends on route and dates",
      hotels:      "See hotel agent results",
      food:        "₹300–₹600 per day",
      transport:   "₹200–₹500 per day",
      sightseeing: "₹200–₹800 per day"
    },
    optimizationTips: [
      "Book trains/buses in advance on IRCTC or redBus.",
      "Group nearby attractions to save on transport."
    ],
    weather,
    assumptions: ["Fallback itinerary — live search unavailable."],
    warnings: error ? [error.message] : []
  };
}

export async function runItineraryAgent(state) {
  const dest        = state.tripSpec?.destination;
  const durationDays = state.tripSpec?.durationDays || 5;
  const budgetStr   = formatBudget(state.tripSpec?.budget);
  const interests   = (state.tripSpec?.interests || []).join(", ") || "general sightseeing";

  logger.info(LABEL, "Starting itinerary generation", {
    destination: dest,
    durationDays,
    budgetStr,
    interests
  });

  if (!dest) {
    return { itinerary: fallbackItinerary(state, {}, null, new Error("No destination in tripSpec")) };
  }

  let travelSearch = {};
  let weather      = null;

  try {
    const searchQuery = [
      `${dest} India tourist attractions places to visit`,
      interests !== "general sightseeing" ? interests : "",
      `₹ budget travel tips local food transport`,
      "2025 itinerary guide"
    ].filter(Boolean).join(" ");

    logger.info(LABEL, "Tavily search query", { searchQuery });

    [travelSearch, weather] = await Promise.all([
      tavilySearch(searchQuery, { maxResults: 8 }),
      getWeatherContext(dest)
    ]);

    logger.info(LABEL, "Search complete", {
      resultCount: travelSearch?.results?.length ?? 0,
      hasWeather:  Boolean(weather)
    });
  } catch (error) {
    logger.error(LABEL, "Search failed — using fallback", { message: error.message });
    return { itinerary: fallbackItinerary(state, {}, null, error) };
  }

  const itineraryPrompt = PromptTemplate.fromTemplate(`
You are an expert Indian travel planner creating a day-by-day itinerary.

STRICT RULES — follow every one:
- Destination: {destination}, INDIA ONLY
- Duration: {durationDays} days
- Total budget: {budgetStr} (ALL costs in Indian Rupees ₹)
- Interests: {interests}
- Only recommend real places, restaurants, and activities IN {destination}, India
- Do NOT mention any place outside {destination} India
- If search results mention foreign locations, IGNORE them entirely
- Budget breakdown must add up to approximately {budgetStr}

User request: {prompt}

Research about {destination}:
{travelSearch}

Weather context:
{weather}

Return ONLY valid JSON (no markdown, no code fences):
{{
  "destination": "{destination}",
  "durationDays": {durationDays},
  "dailyPlan": [
    {{
      "day": 1,
      "theme": "descriptive theme for the day",
      "morning": "specific morning activity with real location name in {destination}",
      "afternoon": "specific afternoon activity with real location name",
      "evening": "evening activity or dining spot in {destination}",
      "food": "specific local dish or restaurant name in {destination}",
      "transport": "how to travel today in {destination} with ₹ cost",
      "budgetNotes": "estimated total spend for this day in ₹"
    }}
  ],
  "budgetBreakdown": {{
    "flights": "₹X (estimated Delhi-{destination} return)",
    "hotels": "₹X per night x {durationDays} nights",
    "food": "₹X per day x {durationDays} days",
    "transport": "₹X total local transport",
    "sightseeing": "₹X total entry fees and activities"
  }},
  "optimizationTips": ["specific tip 1", "specific tip 2", "specific tip 3"],
  "assumptions": ["assumption 1"],
  "warnings": []
}}
`);

  const chain = RunnableSequence.from([
    itineraryPrompt,
    createGroqModel({ temperature: 0.3 }),
    parser
  ]);

  try {
    logger.info(LABEL, "Sending to LLM");
    const itinerary = await chain.invoke({
      prompt:       state.prompt,
      destination:  dest,
      durationDays: String(durationDays),
      budgetStr,
      interests,
      travelSearch: JSON.stringify(travelSearch),
      weather:      JSON.stringify(weather || {})
    });
    logger.info(LABEL, "Itinerary generated", { days: itinerary?.dailyPlan?.length ?? 0 });
    return { itinerary };
  } catch (error) {
    logger.error(LABEL, "LLM failed — using fallback", { message: error.message });
    return { itinerary: fallbackItinerary(state, travelSearch, weather, error) };
  }
}