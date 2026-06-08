import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { runFlightAgent } from "../agents/flightAgent.js";
import { runHotelAgent } from "../agents/hotelAgent.js";
import { runItineraryAgent } from "../agents/itineraryAgent.js";
import { runFinalAgent } from "../agents/finalAgent.js";
import { getContextualMemory, rememberConversation, updateShortTermMemory } from "../memory/memoryManager.js";

const TravelState = Annotation.Root({
  userId: Annotation(),
  chatId: Annotation(),
  prompt: Annotation(),
  conversationHistory: Annotation(),  
  userPreferences: Annotation(),
  tripSpec: Annotation(),
  contextualMemory: Annotation(),
  flights: Annotation(),
  hotels: Annotation(),
  itinerary: Annotation(),
  finalResponse: Annotation(),
  errors: Annotation({
    reducer: (left = [], right = []) => [...left, ...right],
    default: () => []
  })
});

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

  // Fallback to history
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

  return {
    destination: destination || null,
    budget: budgetMatch?.[1]?.trim() || "flexible budget",
    durationDays: daysMatch ? Number(daysMatch[1]) : undefined,
    origin: originMatch?.[1]?.trim(),
    departureDate: undefined,
    returnDate: undefined
  };
}

async function plannerNode(state) {

  const extracted = extractTripSpec(
    state.prompt,
    state.conversationHistory
  );
  const tripSpec = mergeTripSpec(
    state.shortTermMemory || {},
    extracted
  );
  const contextualMemory = await getContextualMemory({
    userId: state.userId,
    query: state.prompt
  });



  await updateShortTermMemory({
    chatId: state.chatId,
    patch: {
      destination: tripSpec.destination,
      budget: tripSpec.budget,
      preferences: [state.userPreferences].filter(Boolean)
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
  const finalResponse = await runFinalAgent(state, config?.configurable?.callbacks || []);
  await rememberConversation({
    userId: state.userId,
    chatId: state.chatId,
    content: `${state.prompt}\n\n${finalResponse}`,
    metadata: {
      type: "trip_plan",
      destination: state.tripSpec.destination
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
    .addEdge(START, "planner")
    .addEdge("planner", "flightAgent")
    .addEdge("planner", "hotelAgent")
    .addEdge("planner", "itineraryAgent")
    .addEdge("flightAgent", "finalAgent")
    .addEdge("hotelAgent", "finalAgent")
    .addEdge("itineraryAgent", "finalAgent")
    .addEdge("finalAgent", END);

  return workflow.compile();
}
