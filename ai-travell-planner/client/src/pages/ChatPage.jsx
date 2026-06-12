import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { SendHorizonal, FileDown } from "lucide-react";
import ChatMessage from "../components/ChatMessage.jsx";
import FlightCards from "../components/FlightCards.jsx";
import HotelCards from "../components/HotelCards.jsx";
import ItineraryTimeline from "../components/ItineraryTimeline.jsx";
import VoiceInputButton from "../components/VoiceInputButton.jsx";
import { useSocketTravel } from "../hooks/useSocketTravel.js";
import { exportTripPdf } from "../utils/exportPdf.js";

export default function ChatPage() {
  // ── Router state ─────────────────────────────────────────────────────────
  // When arriving from TripFormPage, router state carries { tripSpec, chatId }
  // When accessed directly as /app/chat, both are null (free-form mode)
  const { tripId }            = useParams();
  const { state: routerState } = useLocation();

  // ── Core state ────────────────────────────────────────────────────────────
  const [prompt, setPrompt]           = useState("");
  const [messages, setMessages]       = useState([]);
  const [streaming, setStreaming]     = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [error, setError]             = useState("");

  // Track chatId and active tripSpec across follow-up turns
  const [currentChatId, setCurrentChatId]     = useState(routerState?.chatId ?? null);
  const [activeTripSpec, setActiveTripSpec]   = useState(routerState?.tripSpec ?? null);

  // Prevent auto-start from firing twice in StrictMode
  const autoStartedRef = useRef(false);

  const { socket, connected } = useSocketTravel();

  // ── Socket event handlers ─────────────────────────────────────────────────
  useEffect(() => {
    const current = socket.current;
    if (!current) return;

    current.on("travel:started", () => {
      setStreaming(true);
      setError("");
      setMessages(items => [...items, { role: "assistant", content: "" }]);
    });

    current.on("travel:token", ({ token }) => {
      setMessages(items => {
        const next = [...items];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, content: last.content + token };
        return next;
      });
    });

    current.on("travel:complete", ({ chatId, result }) => {
      setStreaming(false);
      setCurrentChatId(chatId);                          // store for follow-ups
      if (result?.tripSpec) setActiveTripSpec(result.tripSpec);
      setLatestResult(result);
      setMessages(items => {
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

  // ── Auto-start when arriving from TripFormPage ────────────────────────────
  // Fires once when socket connects and a tripSpec is present in router state
  useEffect(() => {
    if (
      !autoStartedRef.current &&
      connected &&
      socket.current &&
      activeTripSpec?.destination &&
      activeTripSpec?.origin
    ) {
      autoStartedRef.current = true;
      const autoPrompt = `Plan a complete trip from ${activeTripSpec.origin} to ${activeTripSpec.destination}`;
      setMessages([{ role: "user", content: autoPrompt }]);
      socket.current.emit("travel:plan", {
        prompt:   autoPrompt,
        tripSpec: activeTripSpec,
        chatId:   currentChatId,
        saveTrip: true
      });
    }
  }, [connected, activeTripSpec, currentChatId, socket]);

  // ── Manual submit (follow-up turns) ──────────────────────────────────────
  const canSubmit = useMemo(
    () => prompt.trim() && connected && !streaming,
    [prompt, connected, streaming]
  );

  function submit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setMessages(items => [...items, { role: "user", content: prompt }]);
    socket.current.emit("travel:plan", {
      prompt,
      chatId:   currentChatId,    // always pass so server doesn't create a new chat
      tripSpec: activeTripSpec,   // pass current spec for modification context
      saveTrip: true
    });
    setPrompt("");
  }

  // ── Heading ───────────────────────────────────────────────────────────────
  const heading = activeTripSpec?.destination
    ? `${activeTripSpec.origin ?? "Trip"} → ${activeTripSpec.destination}`
    : "AI Travel Chat";

  const subheading = connected ? "Streaming ready" : "Connecting...";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="min-h-[calc(100vh-4rem)] rounded border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-black">{heading}</h1>
            <p className="text-sm text-slate-600">{subheading}</p>
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
          {messages.length === 0 && !activeTripSpec && (
            <div className="rounded border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              Ask for a complete trip plan with destination, duration, budget, interests, and constraints.
            </div>
          )}
          {messages.length === 0 && activeTripSpec && (
            <div className="rounded border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              {connected ? "Preparing your trip plan…" : "Connecting to server…"}
            </div>
          )}
          {messages.map((message, index) => (
            <ChatMessage key={index} {...message} />
          ))}
          {streaming && (
            <p className="text-sm font-semibold text-reef">Agents are collaborating…</p>
          )}
        </div>

        {error && (
          <p className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={submit} className="flex gap-2">
          <textarea
            rows={2}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="min-h-11 flex-1 resize-none rounded border border-slate-300 px-3 py-3 text-sm"
            placeholder={
              activeTripSpec
                ? "Ask a follow-up: reduce budget, better hotels, add adventure activities…"
                : "Plan a complete 7-day Japan trip under ₹2 lakhs…"
            }
          />
          <VoiceInputButton onTranscript={text => setPrompt(v => `${v} ${text}`.trim())} />
          <button
            disabled={!canSubmit}
            className="grid h-11 w-11 place-items-center rounded bg-coral text-white disabled:opacity-50"
          >
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