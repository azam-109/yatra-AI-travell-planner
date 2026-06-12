import { createGroqModel } from "../config/llm.js";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

export async function runClassifierNode(state) {
  const hasHistory = (state.conversationHistory || []).length > 0;
  const hasTripSpec = Boolean(state.tripSpec?.destination);

  // First message with a pre-built tripSpec = always new_trip
  if (!hasHistory && hasTripSpec) {
    return { intent: "new_trip" };
  }
  if (!hasHistory) {
    return { intent: "new_trip" };
  }

  const prompt = PromptTemplate.fromTemplate(`
Classify the user's intent. Reply with ONLY one of these tokens:
new_trip | modify_budget | modify_destination | modify_dates | modify_hotels | modify_flights | modify_duration | followup_question | non_travel

Rules:
- new_trip: completely new destination or first message
- modify_budget: "cheaper", "under ₹X", "reduce budget", "₹X budget"
- modify_destination: "change to", "go to X instead", different city name
- modify_dates: "change dates", "earlier", "later", specific new dates
- modify_hotels: "better hotels", "cheaper stay", "5 star", hotel-specific
- modify_flights: "different flight", "direct flight", "earlier departure"
- modify_duration: "5 days instead", "extend to", "shorter trip"
- followup_question: question about the existing plan, "how far", "visa", "weather", "what to pack"
- non_travel: completely unrelated

Active trip: {destination} from {origin}
Conversation history (last 4 turns):
{history}

Current message: {prompt}
`);

  const chain = prompt
    .pipe(createGroqModel({ temperature: 0 }))
    .pipe(new StringOutputParser());

  const raw = await chain.invoke({
    destination: state.tripSpec?.destination ?? "unknown",
    origin:      state.tripSpec?.origin      ?? "unknown",
    history: (state.conversationHistory || [])
      .slice(-4)
      .map(m => `${m.role}: ${m.content}`)
      .join("\n"),
    prompt: state.prompt
  });

  const validIntents = [
    "new_trip","modify_budget","modify_destination","modify_dates",
    "modify_hotels","modify_flights","modify_duration",
    "followup_question","non_travel"
  ];
  const intent = validIntents.find(i => raw.includes(i)) ?? "new_trip";

  return { intent };
}