import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { createGroqModel } from "../config/llm.js";
import { logger } from "../utils/logger.js";

const LABEL = "classifierNode";

const VALID_INTENTS = [
  "new_trip",
  "modify_budget",
  "modify_destination",
  "modify_dates",
  "modify_hotels",
  "modify_flights",
  "modify_duration",
  "followup_question",
  "non_travel"
];

const classifyPrompt = PromptTemplate.fromTemplate(`
Classify the user's intent. Reply with ONLY one of these exact tokens, nothing else:
new_trip | modify_budget | modify_destination | modify_dates | modify_hotels | modify_flights | modify_duration | followup_question | non_travel

Definitions:
- new_trip: first message, no prior context, or completely new destination
- modify_budget: user wants cheaper/expensive options, mentions a new price
- modify_destination: user wants to change the destination city/country
- modify_dates: user wants to change travel dates or timing
- modify_hotels: user wants different hotels, better rating, different area
- modify_flights: user wants different flights, airline, class, timing
- modify_duration: user wants to shorten or extend the trip length
- followup_question: question about the existing plan without changing it
- non_travel: completely unrelated to travel

Active trip: {destination} from {origin}

Conversation history (last 4 turns):
{history}

Current message: {prompt}

Reply with ONLY the intent token:
`);

export async function runClassifierNode(state) {
  const hasHistory  = (state.conversationHistory || []).length > 0;
  const hasTripSpec = Boolean(state.tripSpec?.destination);

  // First message with a pre-built tripSpec from the form → always new_trip
  if (!hasHistory && hasTripSpec) {
    logger.info(LABEL, "No history + pre-built tripSpec → new_trip");
    return { intent: "new_trip" };
  }

  // First message with no history → new_trip, no LLM call needed
  if (!hasHistory) {
    logger.info(LABEL, "No history → new_trip");
    return { intent: "new_trip" };
  }

  try {
    const chain = classifyPrompt
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

    const intent = VALID_INTENTS.find(i => raw.trim().includes(i)) ?? "new_trip";

    logger.info(LABEL, "Intent classified", { raw: raw.trim(), intent });

    return { intent };
  } catch (error) {
    // If classifier fails, default to new_trip so the graph still runs
    logger.error(LABEL, "Classification failed — defaulting to new_trip", { message: error.message });
    return { intent: "new_trip" };
  }
}