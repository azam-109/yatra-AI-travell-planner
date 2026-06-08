import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { createGroqModel } from "../config/llm.js";

export async function runFinalAgent(state, callbacks = []) {
  const prompt = PromptTemplate.fromTemplate(`
You are the Final Response Agent for an AI travel planner.
Combine all agent outputs into a polished, conversational travel plan.
Be specific, structured, and honest about assumptions or missing API data.
Use Indian Rupees when the user budget is in INR.
Do not say "we couldn't retrieve data" if any structured agent output is available.
If an agent used fallback data, present the fallback options and clearly label what still needs live verification.
Include:
1. Executive summary
2. Best flight options
3. Best hotel options
4. Day-wise itinerary
5. Budget summary
6. Booking and local travel tips
7. Personalization notes from memory

Original prompt:
{prompt}

Flight Agent JSON:
{flights}

Hotel Agent JSON:
{hotels}

Itinerary Agent JSON:
{itinerary}

Contextual memory:
{memory}
`);

  const chain = RunnableSequence.from([
    prompt,
    createGroqModel({ temperature: 0.35, streaming: callbacks.length > 0, callbacks }),
    new StringOutputParser()
  ]);

  return chain.invoke({
    prompt: state.prompt,
    flights: JSON.stringify(state.flights || {}),
    hotels: JSON.stringify(state.hotels || {}),
    itinerary: JSON.stringify(state.itinerary || {}),
    memory: state.contextualMemory || "No prior memory found."
  });
}
