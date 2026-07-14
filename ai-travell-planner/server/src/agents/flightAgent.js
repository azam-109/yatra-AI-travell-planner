import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";
import { createGroqModel } from "../config/llm.js";
import { searchFlights } from "../services/aviationService.js";
import { logger } from "../utils/logger.js";

const LABEL = "flightAgent";

// ─── IATA city-code lookup (top 30 Indian + common international cities) ─────
// AviationStack's dep_iata / arr_iata expect IATA *airport* codes, not city names.
// We map common city names so the API actually gets something it can search.
const CITY_TO_IATA = {
  // India
  delhi: "DEL", "new delhi": "DEL",
  mumbai: "BOM", bombay: "BOM",
  bangalore: "BLR", bengaluru: "BLR",
  hyderabad: "HYD",
  chennai: "MAA", madras: "MAA",
  kolkata: "CCU", calcutta: "CCU",
  pune: "PNQ",
  ahmedabad: "AMD",
  jaipur: "JAI",
  goa: "GOI",
  kochi: "COK", cochin: "COK",
  lucknow: "LKO",
  varanasi: "VNS",
  amritsar: "ATQ",
  jamshedpur: "IXW",
  patna: "PAT",
  ranchi: "IXR",
  // International
  london: "LHR",
  paris: "CDG",
  tokyo: "NRT",
  osaka: "KIX",
  dubai: "DXB",
  singapore: "SIN",
  bangkok: "BKK",
  "new york": "JFK", "new york city": "JFK",
  "los angeles": "LAX",
  sydney: "SYD",
  toronto: "YYZ",
  amsterdam: "AMS",
  frankfurt: "FRA",
  istanbul: "IST",
  beijing: "PEK",
  shanghai: "PVG",
  "hong kong": "HKG",
  seoul: "ICN",
  kualalumpur: "KUL",
  jakarta: "CGK",
  cairo: "CAI",
  nairobi: "NBO",
  "johannesburg": "JNB",
  "rome": "FCO",
  "madrid": "MAD",
  "barcelona": "BCN",
  "zurich": "ZRH",
  "vienna": "VIE",
  "prague": "PRG",
  "moscow": "SVO",
  "bali": "DPS",
  "maldives": "MLE",
  "phuket": "HKT",
};

/**
 * Convert a city name or existing IATA code into an IATA airport code.
 * Returns the input unchanged if it's already a 3-letter code (like DEL, BOM).
 */
function toIataCode(cityOrCode) {
  if (!cityOrCode) return undefined;
  const trimmed = cityOrCode.trim();
  // Already looks like an IATA code
  if (/^[A-Z]{3}$/.test(trimmed)) return trimmed;
  const key = trimmed.toLowerCase();
  return CITY_TO_IATA[key] ?? trimmed;   // pass through if not found; API may still resolve it
}

const parser = new JsonOutputParser();

function fallbackFlights(state, toolResult, error) {
  const { tripSpec } = state;
  logger.warn(LABEL, "Using fallback flights", {
    destination: tripSpec?.destination,
    origin: tripSpec?.origin,
    departureDate: tripSpec?.departureDate,
    returnDate: tripSpec?.returnDate,
    errorMessage: error?.message ?? null,
    hadToolResult: Boolean(toolResult)
  });

  const hasOrigin = Boolean(tripSpec?.origin);
  const hasDates  = Boolean(tripSpec?.departureDate);

  return {
    flightSummary: error
      ? `Flight search encountered an error: ${error.message}`
      : hasOrigin && hasDates
        ? "Flight data was retrieved but could not be parsed into structured options."
        : "Live flight search requires an origin city and departure date. The itinerary below is still complete.",
    options: [
      {
        airline: "Search required",
        flightNumber: "N/A",
        route: `${tripSpec?.origin ?? "Your origin city"} → ${tripSpec?.destination ?? "destination"}`,
        departure: tripSpec?.departureDate ?? "Add departure date for live search",
        return: tripSpec?.returnDate ?? "Add return date for live search",
        estimatedPrice: "Check Google Flights / MakeMyTrip for current fares",
        recommendation: hasOrigin && hasDates
          ? "AviationStack returned no matching flights for these parameters. Try a different date."
          : "Include origin city and dates (e.g. 'from Delhi on 15 January') for live flight results."
      }
    ],
    estimatedTotal: "Unavailable — requires origin and dates",
    assumptions: [
      hasOrigin ? `Origin detected: ${tripSpec.origin}` : "No origin city found in prompt.",
      hasDates  ? `Departure date detected: ${tripSpec.departureDate}` : "No departure date found in prompt."
    ],
    warnings: error ? [error.message] : []
  };
}

export async function runFlightAgent(state) {
  const { tripSpec } = state;

  // ── 1. Log what the planner handed us ────────────────────────────────────
  logger.info(LABEL, "Received tripSpec", {
    destination:   tripSpec?.destination,
    origin:        tripSpec?.origin        ?? null,
    departureDate: tripSpec?.departureDate ?? null,
    returnDate:    tripSpec?.returnDate    ?? null,
    budget:        tripSpec?.budget,
    durationDays:  tripSpec?.durationDays
  });




  // ── 2. Convert city names → IATA codes ───────────────────────────────────
  const originIata      = toIataCode(tripSpec?.origin);
  const destinationIata = toIataCode(tripSpec?.destination);

  logger.info(LABEL, "IATA codes resolved", {
    originRaw:      tripSpec?.origin        ?? null,
    originIata:     originIata              ?? null,
    destinationRaw: tripSpec?.destination   ?? null,
    destinationIata
  });

  // ── 3. Check minimum viable inputs (destination is the only hard requirement) ──
  if (!destinationIata) {
    logger.warn(LABEL, "No destination — skipping flight search");
    return { flights: fallbackFlights(state, null, null) };
  }

  // ── 4. Call AviationStack ─────────────────────────────────────────────────
  console.log("Flight Search Input:", {
    origin: state.tripSpec?.origin,
    destination: state.tripSpec?.destination,
    departureDate: state.tripSpec?.departureDate,
    returnDate: state.tripSpec?.returnDate
  });


  let rawResult;
  try {
    logger.info(LABEL, "Calling searchFlights", {
      origin:        originIata      ?? "(none)",
      destination:   destinationIata,
      departureDate: tripSpec?.departureDate ?? "(none)",
      returnDate:    tripSpec?.returnDate    ?? "(none)"
    });

    rawResult = await searchFlights({
      origin:        originIata,
      destination:   destinationIata,
      departureDate: tripSpec?.departureDate,
      returnDate:    tripSpec?.returnDate
    });

    logger.info(LABEL, "searchFlights response received", {
      source:       rawResult?.source,
      optionCount:  rawResult?.options?.length ?? 0,
      hasMockFlag:  rawResult?.source === "mock"
    });

    logger.debug(LABEL, "Raw flight API response", rawResult);
  } catch (error) {
    logger.error(LABEL, "searchFlights threw an error", {
      message: error.message,
      stack:   error.stack
    });
    return { flights: fallbackFlights(state, null, error) };
  }

  // ── 5. Handle mock (no API key configured) ────────────────────────────────
  if (rawResult?.source === "mock") {
    logger.warn(LABEL, "AVIATIONSTACK_API_KEY is not set — returning mock result");
    // Still pass through the mock to the LLM so the response is coherent
  }

  // ── 6. Handle 0 live flights (free plan only shows airborne flights) ────────
  const optionCount = rawResult?.options?.length ?? 0;
  const noLiveFlights =
    rawResult?.source === "aviationstack_no_live_flights" ||
    (rawResult?.source === "aviationstack" && optionCount === 0);

  if (noLiveFlights) {
    // Free AviationStack plan only returns live/airborne flights, not scheduled future ones.
    // Replace with an LLM-estimate stub so the LLM generates realistic pricing guidance.
    logger.warn(LABEL, "No live AviationStack flights — switching to LLM estimate mode", {
      origin:      originIata,
      destination: destinationIata,
    });
    rawResult = {
      source:        "llm_estimate",
      origin:        tripSpec?.origin        || originIata,
      destination:   tripSpec?.destination   || destinationIata,
      departureDate: tripSpec?.departureDate,
      returnDate:    tripSpec?.returnDate,
      note: "AviationStack free plan only tracks live airborne flights, not scheduled future departures. Prices below are LLM estimates based on typical route fares. Verify on MakeMyTrip, IndiGo, Air India, or SpiceJet before booking."
    };
  }

  // ── 7. Ask the LLM to format the structured result ────────────────────────
  const toolResult = JSON.stringify(rawResult);

  const prompt = PromptTemplate.fromTemplate(`
You are the Flight Agent for a premium AI travel planning system.
Use the flight API output and user request to present practical flight options.

User request:
{prompt}

Trip details:
- Route: {origin} → {destination}
- Departure: {departureDate}
- Return: {returnDate}
- Flight class: {flightClass}
- Travelers: {travelers}
- Budget: {budget}

Flight API output (source: {source}):
{toolResult}

Instructions:
- If source is "mock", explain that live flight data requires an AviationStack API key.
- If source is "aviationstack", summarise the real live flights returned.
- If source is "llm_estimate", IGNORE the toolResult data field. Instead, USE YOUR KNOWLEDGE to generate realistic flight options for the route {origin} to {destination} on {departureDate}. Include real Indian airlines: IndiGo, Air India, SpiceJet, Vistara, Akasa Air. Provide realistic INR prices for the route.
- Filter/prioritise options matching the requested flight class ({flightClass}) and travelers ({travelers}).
- ALL prices MUST be in Indian Rupees (₹). Never use USD or other currencies.
- Always return valid JSON — no markdown, no code fences.

Return JSON matching exactly:
{{
  "flightSummary": "string",
  "options": [{{ "airline": "", "flightNumber": "", "route": "", "departure": "", "arrival": "", "status": "", "estimatedPrice": "", "recommendation": "" }}],
  "estimatedTotal": "string",
  "assumptions": ["string"],
  "warnings": ["string"]
}}
`);

  const chain = RunnableSequence.from([prompt, createGroqModel({ temperature: 0.2 }), parser]);

  try {
    logger.info(LABEL, "Sending flight data to LLM for formatting");
    const flights = await chain.invoke({
      prompt:        state.prompt,
      source:        rawResult.source,
      toolResult,
      origin:        tripSpec?.origin        || "origin",
      destination:   tripSpec?.destination   || "destination",
      departureDate: tripSpec?.departureDate || "not specified",
      returnDate:    tripSpec?.returnDate    || "not specified",
      flightClass:   tripSpec?.flightClass   || "economy",
      travelers:     String(tripSpec?.travelers || 1),
      budget:        tripSpec?.budget ? `₹${Number(tripSpec.budget).toLocaleString("en-IN")}` : "flexible"
    });
    logger.info(LABEL, "LLM formatted flight options", {
      optionCount: flights?.options?.length ?? 0
    });
    return { flights };
  } catch (error) {
    logger.error(LABEL, "LLM formatting step failed", { message: error.message });
    return { flights: fallbackFlights(state, toolResult, error) };
  }
}