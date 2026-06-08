import { useEffect, useMemo, useState } from "react";
import { SendHorizonal, FileDown } from "lucide-react";
import ChatMessage from "../components/ChatMessage.jsx";
import FlightCards from "../components/FlightCards.jsx";
import HotelCards from "../components/HotelCards.jsx";
import ItineraryTimeline from "../components/ItineraryTimeline.jsx";
import VoiceInputButton from "../components/VoiceInputButton.jsx";
import { useSocketTravel } from "../hooks/useSocketTravel.js";
import { exportTripPdf } from "../utils/exportPdf.js";

const samplePrompt = "Plan a complete 7-day Japan trip under ₹2 lakhs including flights, hotels, sightseeing, food, and transportation.";

export default function ChatPage() {
  const [prompt, setPrompt] = useState(samplePrompt);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [error, setError] = useState("");
  const { socket, connected } = useSocketTravel();
  const [currentChatId, setCurrentChatId] = useState(null);

  useEffect(() => {
    const current = socket.current;
    if (!current) return undefined;

    current.on("travel:started", () => {
      setStreaming(true);
      setError("");
      setMessages((items) => [...items, { role: "assistant", content: "" }]);
    });
    current.on("travel:token", ({ token }) => {
      setMessages((items) => {
        const next = [...items];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, content: `${last.content}${token}` };
        return next;
      });
    });
    current.on("travel:complete", ({ chatId, result }) => {
      setCurrentChatId(chatId);
      setStreaming(false);
      setLatestResult(result);
      setMessages((items) => {
        const next = [...items];
        next[next.length - 1] = { role: "assistant", content: result.finalResponse };
        return next;
      });
    });
    current.on("travel:error", ({ message }) => {
      setStreaming(false);
      setError(message);
    });

    return () => {
      current.off("travel:started");
      current.off("travel:token");
      current.off("travel:complete");
      current.off("travel:error");
    };
  }, [socket]);

  const canSubmit = useMemo(() => prompt.trim() && connected && !streaming, [prompt, connected, streaming]);

  function submit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setMessages((items) => [...items, { role: "user", content: prompt }]);
    socket.current.emit("travel:plan", { prompt, saveTrip: true , chatId: currentChatId});
    setPrompt("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="min-h-[calc(100vh-4rem)] rounded border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-black">AI Travel Chat</h1>
            <p className="text-sm text-slate-600">{connected ? "Streaming ready" : "Connecting..."}</p>
          </div>
          <button
            type="button"
            title="Export PDF"
            onClick={() => exportTripPdf("Yatra AI Trip Plan", latestResult?.finalResponse || messages.at(-1)?.content || "")}
            className="grid h-10 w-10 place-items-center rounded bg-slate-100"
          >
            <FileDown size={18} />
          </button>
        </div>
        <div className="mb-4 flex h-[58vh] flex-col gap-4 overflow-y-auto rounded bg-mist p-4">
          {messages.length === 0 && (
            <div className="rounded border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              Ask for a complete trip plan with destination, duration, budget, interests, and constraints.
            </div>
          )}
          {messages.map((message, index) => (
            <ChatMessage key={index} {...message} />
          ))}
          {streaming && <p className="text-sm font-semibold text-reef">Agents are collaborating...</p>}
        </div>
        {error && <p className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={submit} className="flex gap-2">
          <textarea
            rows={2}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="min-h-11 flex-1 resize-none rounded border border-slate-300 px-3 py-3"
            placeholder="Plan a complete 7-day Japan trip under ₹2 lakhs..."
          />
          <VoiceInputButton onTranscript={(text) => setPrompt((value) => `${value} ${text}`.trim())} />
          <button disabled={!canSubmit} className="grid h-11 w-11 place-items-center rounded bg-coral text-white disabled:opacity-50">
            <SendHorizonal size={18} />
          </button>
        </form>
      </section>
      <aside className="space-y-5">
        <FlightCards flights={latestResult?.flights} />
        <HotelCards hotels={latestResult?.hotels} />
        <ItineraryTimeline itinerary={latestResult?.itinerary} />
      </aside>
    </div>
  );
}
