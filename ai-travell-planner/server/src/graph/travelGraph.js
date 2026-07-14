import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { runFlightAgent } from "../agents/flightAgent.js";
import { runHotelAgent } from "../agents/hotelAgent.js";
import { runItineraryAgent } from "../agents/itineraryAgent.js";
import { runFinalAgent } from "../agents/finalAgent.js";
import { getContextualMemory, rememberConversation, updateShortTermMemory } from "../memory/memoryManager.js";
import { runClassifierNode } from "../nodes/classifierNode.js";
import { logger } from "../utils/logger.js";

// ─── State ────────────────────────────────────────────────────────────────────

const TravelState = Annotation.Root({
  userId: Annotation(),
  chatId: Annotation(),
  prompt: Annotation(),
  conversationHistory: Annotation(),
  userPreferences: Annotation(),
  tripSpec: Annotation(),
  contextualMemory: Annotation(),
  intent: Annotation(),
  flights: Annotation(),
  hotels: Annotation(),
  itinerary: Annotation(),
  finalResponse: Annotation(),
  errors: Annotation({
    reducer: (left = [], right = []) => [...left, ...right],
    default: () => []
  })
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Merge a previously stored tripSpec (from shortTermMemory) with freshly
 * extracted fields. Extracted values always win; missing fields fall back
 * to whatever was carried over from the previous turn.
 */
function mergeTripSpec(previous = {}, extracted = {}) {
  return {
    destination:   extracted.destination   ?? previous.destination,
    origin:        extracted.origin        ?? previous.origin,
    budget:        extracted.budget        ?? previous.budget,
    durationDays:  extracted.durationDays  ?? previous.durationDays,
    departureDate: extracted.departureDate ?? previous.departureDate,
    returnDate:    extracted.returnDate    ?? previous.returnDate
  };
}

/**
 * Normalise a natural-language or numeric date string into YYYY-MM-DD.
 * Handles: "15th January 2026", "Jan 15 2026", "15/01/2026", "2026-01-15".
 * Returns undefined when the input cannot be resolved to a real date.
 */
function normaliseDate(raw) {
  if (!raw) return undefined;

  const trimmed = raw.trim();

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // Let JS handle "December 25 2025", "25 Dec 2025", "Jan 15", etc.
  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  // DD/MM/YYYY or DD-MM-YYYY (JS Date parses these as MM/DD so we handle manually)
  const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const candidate = new Date(
      `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`
    );
    if (!Number.isNaN(candidate.getTime())) return candidate.toISOString().slice(0, 10);
  }

  return undefined;
}

// ─── Trip spec extraction ─────────────────────────────────────────────────────

function extractTripSpec(prompt, conversationHistory = []) {
  // Destination
  const explicitDestinationMatch = prompt.match(
    /\b(?:to|in|for)\s+([A-Z][A-Za-z\s]+?)(?:\s+trip|\s+under|\s+from|\s+including|\.|$)/
  );
  const tripDestinationMatch = prompt.match(
    /(?:\d+\s*-\s*day|\d+\s*day|\d+\s*days)?\s*([A-Z][A-Za-z\s]+?)\s+trip\b/
  );

  // Origin — also catches "departing Mumbai" and "leaving Chennai"
  const originMatch = prompt.match(
    /\b(?:from|departing|leaving)\s+([A-Z][A-Za-z\s]+?)(?:\s+to|\s+under|\s+for|\s+on|\s+including|\.|,|$)/
  );

  // Budget
  const budgetMatch = prompt.match(
    /(?:under|budget(?: of)?|within)\s*([₹$€£]?\s?[\d,.]+\s*(?:lakhs?|lakh|k|usd|inr|dollars?)?)/i
  );

  // Duration
  const daysMatch = prompt.match(/(\d+)\s*(?:day|days|night|nights)/i);

  // Departure date — catches: "on 15th January 2026", "departing 2026-01-15",
  //                            "on Jan 15", "flight on 15/01/2026"
  const departureDateRaw =
    prompt.match(
      /\b(?:on|departing|leaving|depart(?:ure)?)\s+(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s*\d{0,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}-\d{2}-\d{2}|[A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{0,4})/i
    )?.[1] ??
    prompt.match(
      /\bflight\s+(?:on\s+)?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}-\d{2}-\d{2})/i
    )?.[1];

  // Return date — catches: "returning 22 Jan", "back on 22/01/2026"
  const returnDateRaw = prompt.match(
    /\b(?:return(?:ing)?|back\s+on|returning\s+on)\s+(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s*\d{0,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}-\d{2}-\d{2}|[A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{0,4})/i
  )?.[1];

  let destination =
    explicitDestinationMatch?.[1]?.trim() || tripDestinationMatch?.[1]?.trim();

  // Fall back to conversation history when current prompt has no destination
  if (!destination) {
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const msg = conversationHistory[i]?.content || "";
      const match =
        msg.match(
          /\b(?:to|in|for)\s+([A-Z][A-Za-z\s]+?)(?:\s+trip|\s+under|\s+from|\s+including|\.|$)/
        ) ||
        msg.match(
          /(?:\d+\s*-\s*day|\d+\s*day|\d+\s*days)?\s*([A-Z][A-Za-z\s]+?)\s+trip\b/
        );
      if (match?.[1]) {
        destination = match[1].trim();
        break;
      }
    }
  }

  const spec = {
    destination:   destination || null,
    budget:        budgetMatch?.[1]?.trim() || "flexible budget",
    durationDays:  daysMatch ? Number(daysMatch[1]) : undefined,
    origin:        originMatch?.[1]?.trim() ?? undefined,
    departureDate: normaliseDate(departureDateRaw),
    returnDate:    normaliseDate(returnDateRaw)
  };

  logger.debug("extractTripSpec", "Parsed trip spec from prompt", {
    prompt,
    rawDepartureDate: departureDateRaw ?? null,
    rawReturnDate:    returnDateRaw    ?? null,
    spec
  });

  return spec;
}

// ─── Nodes ────────────────────────────────────────────────────────────────────

async function plannerNode(state) {
  const extracted = extractTripSpec(state.prompt, state.conversationHistory);

  // state.tripSpec comes from the form (full structured data) — it always wins.
  // For chat-only (no form), fall back to regex extraction from the prompt.
  const formSpec  = state.tripSpec || {};
  const merged    = mergeTripSpec(state.shortTermMemory || {}, extracted);

  const tripSpec = {
    // Form fields take priority; only fall back to regex if form field is absent
    destination:   formSpec.destination   || merged.destination,
    origin:        formSpec.origin        || merged.origin,
    budget:        formSpec.budget        ?? merged.budget,
    durationDays:  formSpec.durationDays  ?? merged.durationDays,
    departureDate: formSpec.departureDate || merged.departureDate,
    returnDate:    formSpec.returnDate    || merged.returnDate,
    // Pass through all other form fields untouched
    budgetTier:          formSpec.budgetTier,
    travelers:           formSpec.travelers,
    travelStyle:         formSpec.travelStyle,
    interests:           formSpec.interests,
    hotelType:           formSpec.hotelType,
    flightClass:         formSpec.flightClass,
    preferredAirlines:   formSpec.preferredAirlines,
    hotelRating:         formSpec.hotelRating,
    dietary:             formSpec.dietary,
    specialRequirements: formSpec.specialRequirements,
  };

  logger.info("plannerNode", "Trip spec resolved", {
    chatId:        String(state.chatId),
    destination:   tripSpec.destination   ?? "(not found)",
    origin:        tripSpec.origin        ?? "(not found)",
    departureDate: tripSpec.departureDate ?? "(not found)",
    returnDate:    tripSpec.returnDate    ?? "(not found)",
    budget:        tripSpec.budget,
    durationDays:  tripSpec.durationDays
  });

  const contextualMemory = await getContextualMemory({
    userId: state.userId,
    query:  state.prompt
  });

  await updateShortTermMemory({
    chatId: state.chatId,
    patch: {
      destination:   tripSpec.destination,
      origin:        tripSpec.origin,
      budget:        tripSpec.budget,
      durationDays:  tripSpec.durationDays,
      departureDate: tripSpec.departureDate,
      returnDate:    tripSpec.returnDate,
      preferences:   state.userPreferences ? [state.userPreferences] : []
    }
  });

  return { tripSpec, contextualMemory };
}

async function guardedAgent(label, task) {
  try {
    return await task();
  } catch (error) {
    return { errors: [{ agent: label, message: error.message }] };
  }
}

async function flightNode(state) {
  return guardedAgent("flight", () => runFlightAgent(state));
}

async function hotelNode(state) {
  return guardedAgent("hotel", () => runHotelAgent(state));
}

async function itineraryNode(state) {
  return guardedAgent("itinerary", () => runItineraryAgent(state));
}

async function finalNode(state, config) {
  const finalResponse = await runFinalAgent(
    state,
    config?.configurable?.callbacks || []
  );
  await rememberConversation({
    userId:   state.userId,
    chatId:   state.chatId,
    content:  `${state.prompt}\n\n${finalResponse}`,
    metadata: {
      type:        "trip_plan",
      destination: state.tripSpec?.destination
    }
  });
  return { finalResponse };
}

// ─── Graph ────────────────────────────────────────────────────────────────────

// fanOutNode is a pass-through node whose only purpose is to be the single
// target of the planner conditional edge. From here, plain addEdge calls
// fan out to all three agents in parallel. This is the correct LangGraph JS
// pattern — returning an array from a conditional edge is Python-only syntax.
async function fanOutNode(state) {
  return {};  // no state changes, just a routing hub
}

export function createTravelGraph() {
  const workflow = new StateGraph(TravelState)
    .addNode("classifier",     runClassifierNode)
    .addNode("planner",        plannerNode)
    .addNode("fanOut",         fanOutNode)
    .addNode("flightAgent",    flightNode)
    .addNode("hotelAgent",     hotelNode)
    .addNode("itineraryAgent", itineraryNode)
    .addNode("finalAgent",     finalNode)

    // Entry point → classifier
    .addEdge(START, "classifier")

    // Classifier routes by intent — each key maps to exactly one node
    .addConditionalEdges(
      "classifier",
      (state) => {
        if (state.intent === "non_travel")        return "end";
        if (state.intent === "followup_question") return "finalAgent";
        if (state.intent === "modify_hotels")     return "hotelAgent";
        if (state.intent === "modify_flights")    return "flightAgent";
        if (state.intent === "modify_duration")   return "itineraryAgent";
        return "planner"; // new_trip | modify_destination | modify_dates | modify_budget
      },
      {
        end:            END,
        finalAgent:     "finalAgent",
        hotelAgent:     "hotelAgent",
        flightAgent:    "flightAgent",
        itineraryAgent: "itineraryAgent",
        planner:        "planner"
      }
    )

    // Planner → guard → fanOut or short-circuit to finalAgent
    .addConditionalEdges(
      "planner",
      (state) => {
        if (!state.tripSpec?.destination) {
          logger.warn("plannerNode", "No destination — short-circuiting to finalAgent");
          return "finalAgent";
        }
        return "fanOut";
      },
      { finalAgent: "finalAgent", fanOut: "fanOut" }
    )

    // fanOut → all three agents in parallel (plain edges = LangGraph JS fan-out)
    .addEdge("fanOut", "flightAgent")
    .addEdge("fanOut", "hotelAgent")
    .addEdge("fanOut", "itineraryAgent")

    // All three agents converge on finalAgent
    .addEdge("flightAgent",    "finalAgent")
    .addEdge("hotelAgent",     "finalAgent")
    .addEdge("itineraryAgent", "finalAgent")
    .addEdge("finalAgent",     END);

  return workflow.compile();
}