import { runFlightAgent } from "./flightAgent.js";
import { logger } from "../utils/logger.js";

(async () => {
  try {
    const mockState = {
      tripSpec: {
        origin: "Mumbai",
        destination: "Delhi",
        departureDate: "2026-06-20",
        returnDate: "2026-06-25",
        budget: 50000,
        travelers: 2,
        flightClass: "economy"
      },
      prompt: "Plan my trip from Mumbai to Delhi"
    };

    console.log("\n=== Testing Full Flight Agent ===\n");
    console.log("Input state:", JSON.stringify(mockState, null, 2));

    const result = await runFlightAgent(mockState);

    console.log("\n=== Flight Agent Result ===\n");
    console.log(JSON.stringify(result, null, 2));

  } catch (err) {
    logger.error("TEST", "Flight agent test failed", { message: err.message });
    console.error(err.stack);
    process.exitCode = 1;
  }
})();
