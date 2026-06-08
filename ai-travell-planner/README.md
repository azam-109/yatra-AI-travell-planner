# Yatra AI Travel Planner

A production-ready MERN travel planning system using React, Tailwind CSS, Express, MongoDB Atlas, LangChain JS, LangGraph JS, Groq Llama 3.3 70B, Socket.IO streaming, JWT auth, and MongoDB Atlas Vector Search.

## Features

- Multi-agent AI workflow with Flight, Hotel, Itinerary, and Final Response agents
- LangGraph fan-out/fan-in orchestration with state, retries, and error collection
- Groq `llama-3.3-70b-versatile` through `ChatGroq`
- AviationStack flight search integration
- Tavily hotel and destination research integration
- Optional OpenWeather context
- JWT authentication
- Persistent chat history and saved trips
- Short-term chat memory
- Long-term RAG memory using MongoDB Atlas Vector Search
- Socket.IO real-time response streaming
- Voice input, PDF export, and trip sharing support
- Responsive React UI with loading and error states

## Project Structure

```txt
travel-ai/
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── context/
│       ├── services/
│       └── utils/
├── server/
│   └── src/
│       ├── agents/
│       ├── graph/
│       ├── memory/
│       ├── models/
│       ├── routes/
│       ├── controllers/
│       ├── middleware/
│       ├── services/
│       ├── utils/
│       └── config/
└── README.md
```

## Setup

1. Install dependencies:

```bash
cd travel-ai
npm install
npm run install:all
```

2. Configure server environment:

```bash
cp .env.example server/.env
```

Required server values:

```env
GROQ_API_KEY=
TAVILY_API_KEY=
AVIATIONSTACK_API_KEY=
MONGODB_URI=
JWT_SECRET=
CLIENT_ORIGIN=http://localhost:5173
PORT=5000
```

3. Configure client environment:

```bash
cp client/.env.example client/.env
```

4. Run locally:

```bash
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000`

## MongoDB Atlas Vector Search

Create a Vector Search index on the `vector_memories` collection:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 384,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "userId"
    }
  ]
}
```

Name the index `vector_memory_index`. The app includes a recency fallback so local development still works before the Atlas index is ready.

## Agent Workflow

```txt
START
  ↓
Planner Node
  ↓
Parallel execution
  ├── Flight Agent
  ├── Hotel Agent
  └── Itinerary Agent
  ↓
Final Response Agent
  ↓
END
```

The Planner node extracts the trip specification, retrieves semantic memory, and updates short-term memory. Specialist agents use tools and LangChain `RunnableSequence` pipelines. The final agent streams the polished response to the browser through Socket.IO.

## API Examples

Register:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Asha\",\"email\":\"asha@example.com\",\"password\":\"password123\"}"
```

Create a non-streaming plan:

```bash
curl -X POST http://localhost:5000/api/chat/plan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"Plan a complete 7-day Japan trip under ₹2 lakhs including flights, hotels, sightseeing, food, and transportation.\"}"
```

Socket event:

```js
socket.emit("travel:plan", {
  prompt: "Plan a 5-day Thailand food and island trip under ₹90,000",
  saveTrip: true
});
```

## Sample Prompts

- `Plan a complete 7-day Japan trip under ₹2 lakhs including flights, hotels, sightseeing, food, and transportation.`
- `Create a budget-friendly 6-day Bali honeymoon itinerary with private villas and vegetarian food.`
- `Plan a 10-day Europe trip from Delhi focused on museums, trains, and boutique hotels.`
- `Build a weather-aware 4-day Singapore family trip with kid-friendly activities.`

## Deployment

### Backend on Render or Railway

- Root directory: `travel-ai/server`
- Build command: `npm install`
- Start command: `npm start`
- Add all server environment variables
- Set `CLIENT_ORIGIN` to your Vercel frontend URL

### Frontend on Vercel

- Root directory: `travel-ai/client`
- Build command: `npm run build`
- Output directory: `dist`
- Add `VITE_API_URL` with your deployed backend URL

## Notes

- AviationStack's basic flight endpoint does not always include fare prices, so the Flight Agent surfaces that limitation clearly and still compares schedule options.
- The included `HashEmbeddings` implementation avoids requiring a second embedding vendor. For higher-quality production retrieval, replace it with a dedicated embedding model while keeping the same `vectorStore.js` interface.
- Keep API keys server-side only. The frontend only receives the backend URL.
