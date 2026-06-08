import { JsonOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createGroqModel } from "../config/llm.js";
import { searchFlights } from "../services/aviationService.js";

const flightSearchTool = new DynamicStructuredTool({
  name: "search_flights",
  description: "Search flights from AviationStack using route and travel date information.",
  schema: z.object({
    origin: z.string().optional(),
    destination: z.string(),
    departureDate: z.string().optional(),
    returnDate: z.string().optional()
  }),
  func: async (input) => JSON.stringify(await searchFlights(input))
});

const parser = new JsonOutputParser();

function fallbackFlights(state, toolResult, error) {
  return {
    flightSummary: error
      ? `Flight fallback used because live processing failed: ${error.message}`
      : "Flight options require origin airport/city and travel dates for accurate live search.",
    options: [
      {
        airline: "Search required",
        flightNumber: "N/A",
        route: `${state.tripSpec.origin || "Your origin city"} to ${state.tripSpec.destination}`,
        departure: state.tripSpec.departureDate || "Flexible date",
        return: state.tripSpec.returnDate || "Flexible return",
        estimatedPrice: "Check live fare after entering origin and dates",
        recommendation: "Add origin city and dates for AviationStack-backed flight lookup."
      }
    ],
    estimatedTotal: "Unavailable without origin/date",
    assumptions: ["The prompt did not include enough flight search fields for reliable live flight lookup."],
    warnings: [toolResult ? "AviationStack may not provide fare prices on the basic flights endpoint." : "No flight API data returned."]
  };
}

export async function runFlightAgent(state) {
  let toolResult = "";
  try {
    toolResult = await flightSearchTool.invoke({
      origin: state.tripSpec.origin,
      destination: state.tripSpec.destination,
      departureDate: state.tripSpec.departureDate,
      returnDate: state.tripSpec.returnDate
    });
  } catch (error) {
    return { flights: fallbackFlights(state, toolResult, error) };
  }

  const prompt = PromptTemplate.fromTemplate(`
You are the Flight Agent for a premium AI travel planning system.
Use the flight API output and user request to compare practical flight options.

User request:
{prompt}

Flight API output:
{toolResult}

Return strict JSON with:
flightSummary, options[], estimatedTotal, assumptions[], warnings[].
`);

  const chain = RunnableSequence.from([prompt, createGroqModel({ temperature: 0.2 }), parser]);
  try {
    const flights = await chain.invoke({ prompt: state.prompt, toolResult });
    return { flights };
  } catch (error) {
    return { flights: fallbackFlights(state, toolResult, error) };
  }
}
