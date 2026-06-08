import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { createGroqModel } from "../config/llm.js";
import { tavilySearch } from "../services/tavilyService.js";
import { getWeatherContext } from "../services/weatherService.js";

const parser = new JsonOutputParser();

function fallbackItinerary(state, travelSearch = {}, weather = null, error = null) {
  const durationDays = state.tripSpec.durationDays || 7;
  const highlights = (travelSearch.results || [])
    .slice(0, durationDays)
    .map((result) => result.title)
    .filter(Boolean);

  const dailyPlan = Array.from({ length: durationDays }, (_, index) => ({
    day: index + 1,
    theme: highlights[index] || `${state.tripSpec.destination} highlights`,
    morning: "Start with a major landmark or neighborhood walk.",
    afternoon: "Visit a museum, temple, market, viewpoint, or local cultural area.",
    evening: "Explore a food street, shopping district, or relaxed scenic area.",
    food: "Prioritize local restaurants near the day's route.",
    transport: "Use public transport and group nearby attractions together.",
    budgetNotes: "Keep paid attractions selective and balance them with free neighborhoods, gardens, and markets."
  }));

  return {
    destination: state.tripSpec.destination,
    durationDays,
    dailyPlan,
    budgetBreakdown: {
      flights: "Depends on origin and dates",
      hotels: "Use selected hotel rates",
      food: "Moderate local dining",
      transport: "Public transport passes where useful",
      sightseeing: "Mix paid and free attractions"
    },
    optimizationTips: ["Book intercity trains and popular attractions early.", "Group sights by area to reduce daily transport cost."],
    weather,
    assumptions: ["Fallback itinerary used because structured itinerary generation was unavailable."],
    warnings: error ? [error.message] : []
  };
}

export async function runItineraryAgent(state) {
  let travelSearch = {};
  let weather = null;
  try {
    [travelSearch, weather] = await Promise.all([
      tavilySearch(`${state.tripSpec.destination} best attractions food transport itinerary budget tips`, {
        maxResults: 8
      }),
      getWeatherContext(state.tripSpec.destination)
    ]);
  } catch (error) {
    return { itinerary: fallbackItinerary(state, travelSearch, weather, error) };
  }

  const prompt = PromptTemplate.fromTemplate(`
You are the Itinerary Agent. Build a day-wise itinerary optimized for budget, transport, local food, and travel pace.

User request:
{prompt}

Personalized memories:
{memory}

Destination research:
{travelSearch}

Weather context:
{weather}

Return strict JSON with:
destination, durationDays, dailyPlan[] where each day has day/theme/morning/afternoon/evening/food/transport/budgetNotes,
budgetBreakdown, optimizationTips[], assumptions[].
`);

  const chain = RunnableSequence.from([prompt, createGroqModel({ temperature: 0.45 }), parser]);
  try {
    const itinerary = await chain.invoke({
      prompt: state.prompt,
      memory: state.contextualMemory || "No prior memory found.",
      travelSearch: JSON.stringify(travelSearch),
      weather: JSON.stringify(weather || {})
    });
    return { itinerary };
  } catch (error) {
    return { itinerary: fallbackItinerary(state, travelSearch, weather, error) };
  }
}
