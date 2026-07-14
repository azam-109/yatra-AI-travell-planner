import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { createGroqModel } from "../config/llm.js";
import { logger } from "../utils/logger.js";

const LABEL = "finalAgent";

export async function runFinalAgent(state, callbacks = []) {
  const dest       = state.tripSpec?.destination || "the destination";
  const origin     = state.tripSpec?.origin      || "origin city";
  const budgetNumber = Number(state.tripSpec?.budget);

  const budget =
    Number.isFinite(budgetNumber) && budgetNumber > 0
      ? `₹${budgetNumber.toLocaleString("en-IN")}`
      : "flexible";
  const days       = state.tripSpec?.durationDays || "unspecified number of";
  const interests  = (state.tripSpec?.interests || []).join(", ") || "general";

  logger.info(LABEL, "Generating final response", { dest, origin, budget, days });

  const finalPrompt = PromptTemplate.fromTemplate(`
You are the final travel planner for an Indian travel app. Write a clear, helpful, well-structured travel plan.

STRICT RULES:
- Trip is from {origin} to {destination}, INDIA
- Total budget: {budget} (ALL prices in Indian Rupees ₹ only)
- Duration: {days} days
- Interests: {interests}
- ONLY reference hotels, restaurants, and places in {destination}, India
- If hotel data mentions ANY location outside India (USA, Europe, etc.) — DISCARD it and say "check Booking.com for live rates in {destination}"
- NEVER show prices in USD, EUR, or any currency other than INR ₹
- Be specific: use real place names in {destination}
- Be honest: if live data was unavailable for a section, say so briefly and suggest where to check

Write the plan in this structure:

## Trip Overview
One short paragraph summarising the trip: {origin} → {destination}, {days} days, budget {budget}.

## Flights
Present flight options from the Flight Agent data. Include airline names, route, departure time, estimated price in ₹, and a recommendation.
If source is "llm_estimate", present the LLM-estimated options and note they should be verified on MakeMyTrip or airline websites.
If source is "mock", note that AviationStack API key is not configured and give a realistic price range for {origin}→{destination} in ₹.
ALL prices must be in Indian Rupees ₹.

## Hotels
Present the hotel options from the Hotel Agent data exactly as given. Show name, area/neighbourhood, price per night in ₹, and star rating.
If prices are not in ₹, convert them. Always show at least 3 options.
Do NOT say "irrelevant results" — the hotel agent has already filtered for {destination}.

## Day-by-Day Itinerary
Present the {days}-day plan. Each day: theme, morning, afternoon, evening, food recommendation, transport tip, estimated daily spend in ₹.

## Budget Breakdown
Show a clear table-style breakdown in ₹:
- Flights (return)
- Accommodation ({days} nights)
- Food ({days} days)
- Local transport
- Activities & sightseeing
- Total estimate

## Booking Tips
3-5 specific, practical tips for this exact trip.

---

Flight Agent data:
{flights}

Hotel Agent data:
{hotels}

Itinerary Agent data:
{itinerary}

User's original request:
{prompt}

Prior travel memory:
{memory}
`);

  const chain = RunnableSequence.from([
    finalPrompt,
    createGroqModel({ temperature: 0.3, streaming: callbacks.length > 0, callbacks }),
    new StringOutputParser()
  ]);

  const result = await chain.invoke({
    prompt:      state.prompt,
    destination: dest,
    origin,
    budget,
    days:        String(days),
    interests,
    flights:     JSON.stringify(state.flights   || {}),
    hotels:      JSON.stringify(state.hotels    || {}),
    itinerary:   JSON.stringify(state.itinerary || {}),
    memory:      state.contextualMemory || "No prior memory."
  });

  logger.info(LABEL, "Final response generated", { chars: result.length });
  return result;
}