import { createTravelGraph } from "./travelGraph.js";
import { logger } from "../utils/logger.js";

(async () => {
  try {
    const graph = createTravelGraph();

    const state = {
      userId: "test-user-123",
      chatId: "test-chat-456",
      prompt: "Plan a 3-day trip from Mumbai to Delhi under ₹50,000",
      conversationHistory: [],
      userPreferences: {},
      tripSpec: {
        origin: "Mumbai",
        destination: "Delhi",
        departureDate: "2026-06-20",
        returnDate: "2026-06-23",
        budget: 50000,
        durationDays: 3,
        travelers: 2,
        flightClass: "economy"
      },
      contextualMemory: null,
      intent: null,
      flights: null,
      hotels: null,
      itinerary: null,
      finalResponse: null,
      errors: []
    };

    console.log("\n=== Running Complete Travel Graph ===\n");
    console.log("Input state:", JSON.stringify(state, null, 2));

    const result = await graph.invoke(state);

    console.log("\n=== Graph Result ===\n");
    console.log("Flights present:", !!result.flights);
    console.log("Hotels present:", !!result.hotels);
    console.log("Itinerary present:", !!result.itinerary);
    console.log("Final response length:", result.finalResponse?.length || 0);
    console.log("Errors:", result.errors || []);

    console.log("\n=== Full Result Structure ===\n");
    console.log(JSON.stringify(result, null, 2));

  } catch (err) {
    logger.error("TEST", "Graph test failed", { message: err.message });
    console.error(err.stack);
    process.exitCode = 1;
  }
})();
