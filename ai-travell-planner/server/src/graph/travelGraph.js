import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { runFlightAgent } from "../agents/flightAgent.js";
import { runHotelAgent } from "../agents/hotelAgent.js";
import { runItineraryAgent } from "../agents/itineraryAgent.js";
import { runFinalAgent } from "../agents/finalAgent.js";
import { getContextualMemory, rememberConversation, updateShortTermMemory } from "../memory/memoryManager.js";
import { runClassifierNode } from "../nodes/classifierNode.js";


const TravelState = Annotation.Root({
  userId: Annotation(),
  chatId: Annotation(),
  tripId: Annotation(),
  prompt: Annotation(),
  conversationHistory: Annotation(),  
  userPreferences: Annotation(),
  tripSpec: Annotation(),
  contextualMemory: Annotation(),
  intent: Annotation(), // NEW
  flights: Annotation(),
  hotels: Annotation(),
  itinerary: Annotation(),
  finalResponse: Annotation(),
  tripVersion:         Annotation(),
  modificationHistory: Annotation(),
  selectedFlight:      Annotation(),
  selectedHotel:       Annotation(),
  errors: Annotation({
    reducer: (left = [], right = []) => [...left, ...right],
    default: () => []
  })
});

function normaliseDate(dateStr) {
  if (!dateStr) return undefined;

  const cleaned = dateStr
    .replace(/(\d+)(st|nd|rd|th)/gi, "$1")
    .trim();

  const parsed = new Date(cleaned);

  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString().split("T")[0];
}

function extractDate(text, type = "departure") {
  if (!text) return undefined;

  const patterns =
    type === "return"
      ? [
          /(?:return|returning|back on)\s+([A-Za-z0-9,\s/-]+)/i,
          /(?:return date)\s*[:\-]?\s*([A-Za-z0-9,\s/-]+)/i
        ]
      : [
          /(?:on|departing on|leaving on)\s+([A-Za-z0-9,\s/-]+)/i,
          /(?:departure date)\s*[:\-]?\s*([A-Za-z0-9,\s/-]+)/i
        ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      const normalised = normaliseDate(match[1].trim());

      if (normalised) {
        return normalised;
      }
    }
  }

  return undefined;
}

function mergeTripSpec(previous = {}, extracted = {}) {
  return {
    destination: extracted.destination ?? previous.destination,
    origin: extracted.origin ?? previous.origin,
    budget: extracted.budget ?? previous.budget,
    durationDays: extracted.durationDays ?? previous.durationDays,
    departureDate: extracted.departureDate ?? previous.departureDate,
    returnDate: extracted.returnDate ?? previous.returnDate
  };
}


function extractTripSpec(prompt, conversationHistory = []) {
  const explicitDestinationMatch = prompt.match(
    /\b(?:to|in|for)\s+([A-Z][A-Za-z\s]+?)(?:\s+trip|\s+under|\s+from|\s+including|\.|$)/
  );

  const tripDestinationMatch = prompt.match(
    /(?:\d+\s*-\s*day|\d+\s*day|\d+\s*days)?\s*([A-Z][A-Za-z\s]+?)\s+trip\b/
  );

  const originMatch = prompt.match(
    /\bfrom\s+([A-Z][A-Za-z\s]+?)(?:\s+to|\s+under|\s+for|\s+on|\s+including|\.|$)/
  );

  const budgetMatch = prompt.match(
    /(?:under|budget(?: of)?|within)\s*([₹$€£]?\s?[\d,.]+\s*(?:lakhs?|lakh|k|usd|inr|dollars?)?)/
  );

  const daysMatch = prompt.match(
    /(\d+)\s*(?:day|days|night|nights)/i
  );

  let destination =
    explicitDestinationMatch?.[1]?.trim() ||
    tripDestinationMatch?.[1]?.trim();

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

  const departureDate =
    extractDate(prompt, "departure") ||
    conversationHistory
      .map((m) => m.content || "")
      .map((msg) => extractDate(msg, "departure"))
      .find(Boolean);

  const returnDate =
    extractDate(prompt, "return") ||
    conversationHistory
      .map((m) => m.content || "")
      .map((msg) => extractDate(msg, "return"))
      .find(Boolean);

  return {
    destination: destination || null,
    budget: budgetMatch?.[1]?.trim() || "flexible budget",
    durationDays: daysMatch ? Number(daysMatch[1]) : undefined,
    origin: originMatch?.[1]?.trim(),
    departureDate,
    returnDate
  };
}

async function plannerNode(state) {

  let tripSpec;

  if (state.tripSpec?.destination && state.tripSpec?.origin) {
    logger.info("plannerNode", "Using pre-built tripSpec from form — skipping regex");
    tripSpec = state.tripSpec;
  } else {
    const extracted = extractTripSpec(state.prompt, state.conversationHistory);
    tripSpec = mergeTripSpec(state.shortTermMemory || {}, extracted);
    logger.info("plannerNode", "Extracted tripSpec from prompt", tripSpec);
  }


  const contextualMemory = await getContextualMemory({
    userId: state.userId,
    query: state.prompt
  });



  await updateShortTermMemory({
    chatId: state.chatId,
    patch: {
      destination:   tripSpec.destination,
      origin:        tripSpec.origin,
      departureDate: tripSpec.departureDate,
      returnDate:    tripSpec.returnDate,
      budget:        String(tripSpec.budget),
      preferences:   [state.userPreferences].filter(Boolean)
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

  // ── persist to vector memory ──────────────────────────────────────────────
  await rememberConversation({
    userId:  state.userId,
    chatId:  state.chatId,
    content: `Trip from ${state.tripSpec?.origin ?? "unknown"} to ${state.tripSpec?.destination ?? "unknown"}, \
${state.tripSpec?.durationDays ?? "?"} days, budget ₹${state.tripSpec?.budget ?? "flexible"}, \
style: ${state.tripSpec?.travelStyle ?? "not set"}, \
interests: ${(state.tripSpec?.interests ?? []).join(", ") || "none specified"}`,
    metadata: {
      type:        "trip_spec",
      destination: state.tripSpec?.destination,
      origin:      state.tripSpec?.origin,
      budget:      state.tripSpec?.budget,
      tripId:      state.tripId        // populated once you add tripId to TravelState
    }
  });

  return { finalResponse };
}

export function createTravelGraph() {
  const workflow = new StateGraph(TravelState)
    .addNode("planner", plannerNode)
    .addNode("flightAgent", flightNode)
    .addNode("hotelAgent", hotelNode)
    .addNode("itineraryAgent", itineraryNode)
    .addNode("finalAgent", finalNode)
    .addNode("classifier", runClassifierNode)
    .addEdge(START, "classifier")
    .addConditionalEdges(
      "classifier",
      (state) => {
        switch (state.intent) {
          case "non_travel":          return "end";
          case "followup_question":   return "finalOnly";
          case "modify_budget":       return "hotelsOnly";
          case "modify_hotels":       return "hotelsOnly";
          case "modify_flights":      return "flightsOnly";
          case "modify_duration":     return "itineraryOnly";
          case "modify_destination":  return "planner";  // full re-run
          case "modify_dates":        return "planner";  // full re-run
          default:                    return "planner";  // new_trip
        }
      },
      {
        end:           END,
        finalOnly:     "finalAgent",
        hotelsOnly:    "hotelAgent",
        flightsOnly:   "flightAgent",
        itineraryOnly: "itineraryAgent",
        planner:       "planner"
      }
    )
    .addEdge("planner", "flightAgent")
    .addEdge("planner", "hotelAgent")
    .addEdge("planner", "itineraryAgent")
    .addEdge("flightAgent", "finalAgent")
    .addEdge("hotelAgent", "finalAgent")
    .addEdge("itineraryAgent", "finalAgent")
    .addEdge("finalAgent", END);

  return workflow.compile();
}



















// import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
// import { runFlightAgent } from "../agents/flightAgent.js";
// import { runHotelAgent } from "../agents/hotelAgent.js";
// import { runItineraryAgent } from "../agents/itineraryAgent.js";
// import { runFinalAgent } from "../agents/finalAgent.js";
// import { getContextualMemory, rememberConversation, updateShortTermMemory } from "../memory/memoryManager.js";
// import { runClassifierNode } from "../nodes/classifierNode.js";


// const TravelState = Annotation.Root({
//   userId: Annotation(),
//   chatId: Annotation(),
//   prompt: Annotation(),
//   conversationHistory: Annotation(),  
//   userPreferences: Annotation(),
//   tripSpec: Annotation(),
//   contextualMemory: Annotation(),
//   intent: Annotation(), // NEW
//   flights: Annotation(),
//   hotels: Annotation(),
//   itinerary: Annotation(),
//   finalResponse: Annotation(),
//   errors: Annotation({
//     reducer: (left = [], right = []) => [...left, ...right],
//     default: () => []
//   })
// });

// function mergeTripSpec(previous = {}, extracted = {}) {
//   return {
//     destination: extracted.destination ?? previous.destination,
//     origin: extracted.origin ?? previous.origin,
//     budget: extracted.budget ?? previous.budget,
//     durationDays: extracted.durationDays ?? previous.durationDays,
//     departureDate: extracted.departureDate ?? previous.departureDate,
//     returnDate: extracted.returnDate ?? previous.returnDate
//   };
// }


// function extractTripSpec(prompt, conversationHistory = []) {
//   const explicitDestinationMatch = prompt.match(
//     /\b(?:to|in|for)\s+([A-Z][A-Za-z\s]+?)(?:\s+trip|\s+under|\s+from|\s+including|\.|$)/
//   );

//   const tripDestinationMatch = prompt.match(
//     /(?:\d+\s*-\s*day|\d+\s*day|\d+\s*days)?\s*([A-Z][A-Za-z\s]+?)\s+trip\b/
//   );

//   const originMatch = prompt.match(
//     /\bfrom\s+([A-Z][A-Za-z\s]+?)(?:\s+to|\s+under|\s+for|\s+on|\s+including|\.|$)/
//   );

//   const budgetMatch = prompt.match(
//     /(?:under|budget(?: of)?|within)\s*([₹$€£]?\s?[\d,.]+\s*(?:lakhs?|lakh|k|usd|inr|dollars?)?)/
//   );

//   const daysMatch = prompt.match(
//     /(\d+)\s*(?:day|days|night|nights)/i
//   );

//   let destination =
//     explicitDestinationMatch?.[1]?.trim() ||
//     tripDestinationMatch?.[1]?.trim();

//   // Fallback to history
//   if (!destination) {
//     for (let i = conversationHistory.length - 1; i >= 0; i--) {
//       const msg = conversationHistory[i]?.content || "";

//       const match =
//         msg.match(
//           /\b(?:to|in|for)\s+([A-Z][A-Za-z\s]+?)(?:\s+trip|\s+under|\s+from|\s+including|\.|$)/
//         ) ||
//         msg.match(
//           /(?:\d+\s*-\s*day|\d+\s*day|\d+\s*days)?\s*([A-Z][A-Za-z\s]+?)\s+trip\b/
//         );

//       if (match?.[1]) {
//         destination = match[1].trim();
//         break;
//       }
//     }
//   }

//   return {
//     destination: destination || null,
//     budget: budgetMatch?.[1]?.trim() || "flexible budget",
//     durationDays: daysMatch ? Number(daysMatch[1]) : undefined,
//     origin: originMatch?.[1]?.trim(),
//     departureDate: undefined,
//     returnDate: undefined
//   };
// }

// async function plannerNode(state) {

//   const extracted = extractTripSpec(
//     state.prompt,
//     state.conversationHistory
//   );
//   const tripSpec = mergeTripSpec(
//     state.shortTermMemory || {},
//     extracted
//   );
//   const contextualMemory = await getContextualMemory({
//     userId: state.userId,
//     query: state.prompt
//   });



//   await updateShortTermMemory({
//     chatId: state.chatId,
//     patch: {
//       destination: tripSpec.destination,
//       budget: tripSpec.budget,
//       preferences: [state.userPreferences].filter(Boolean)
//     }
//   });

//   return { tripSpec, contextualMemory };
// }

// async function guardedAgent(label, task) {
//   try {
//     return await task();
//   } catch (error) {
//     return { errors: [{ agent: label, message: error.message }] };
//   }
// }

// async function flightNode(state) {
//   return guardedAgent("flight", () => runFlightAgent(state));
// }

// async function hotelNode(state) {
//   return guardedAgent("hotel", () => runHotelAgent(state));
// }

// async function itineraryNode(state) {
//   return guardedAgent("itinerary", () => runItineraryAgent(state));
// }

// async function finalNode(state, config) {
//   const finalResponse = await runFinalAgent(state, config?.configurable?.callbacks || []);
//   await rememberConversation({
//     userId: state.userId,
//     chatId: state.chatId,
//     content: `${state.prompt}\n\n${finalResponse}`,
//     metadata: {
//       type: "trip_plan",
//       destination: state.tripSpec.destination
//     }
//   });
//   return { finalResponse };
// }

// export function createTravelGraph() {
//   const workflow = new StateGraph(TravelState)
//     .addNode("planner", plannerNode)
//     .addNode("flightAgent", flightNode)
//     .addNode("hotelAgent", hotelNode)
//     .addNode("itineraryAgent", itineraryNode)
//     .addNode("finalAgent", finalNode)
//     .addNode("classifier", runClassifierNode)
//     .addEdge(START, "classifier")
//     .addConditionalEdges("classifier", (state) => {
//       if (state.intent === "non_travel") return "end";
//       if (state.intent === "followup_question") return "finalAgent"; // skip expensive agents
//       return "planner";  // new_trip or modify_trip
//     }, { end: END, finalAgent: "finalAgent", planner: "planner" })
//     .addEdge("planner", "flightAgent")
//     .addEdge("planner", "hotelAgent")
//     .addEdge("planner", "itineraryAgent")
//     .addEdge("flightAgent", "finalAgent")
//     .addEdge("hotelAgent", "finalAgent")
//     .addEdge("itineraryAgent", "finalAgent")
//     .addEdge("finalAgent", END);

//   return workflow.compile();
// }

