import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  ArrowUpRight,
  Bot,
  CalendarDays,
  Copy,
  FileDown,
  Globe2,
  MapPinned,
  Mic,
  PlaneTakeoff,
  SendHorizonal,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Ticket,
  UtensilsCrossed,
  Waves
} from "lucide-react";
import ChatMessage from "../components/ChatMessage.jsx";
import FlightCards from "../components/FlightCards.jsx";
import HotelCards from "../components/HotelCards.jsx";
import ItineraryTimeline from "../components/ItineraryTimeline.jsx";
import VoiceInputButton from "../components/VoiceInputButton.jsx";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import { useSocketTravel } from "../hooks/useSocketTravel.js";
import { exportTripPdf } from "../utils/exportPdf.js";
import {
  deriveBudgetAllocations,
  estimateTripStats,
  extractWeatherSummary,
  formatCurrency,
  formatDate,
  workflowSteps,
  SectionCard,
  StatusPill,
  ProgressBar,
  QuickChip,
  StatCard,
  FloatingOrbs,
  classNames
} from "../components/TravelUI.jsx";

function StepDot({ status, index }) {
  const tone =
    status === "complete"
      ? "bg-emerald-400 text-slate-950"
      : status === "active"
        ? "bg-cyan-400 text-slate-950 animate-soft-pulse"
        : "border border-white/10 bg-white/5 text-white/[0.35]";

  return (
    <div className={classNames("grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold", tone)}>
      {status === "complete" ? "✓" : index + 1}
    </div>
  );
}

function WorkflowPanel({ streaming, connected, workflowStep, tripSpec }) {
  const currentLabel =
    streaming && workflowStep < workflowSteps.length
      ? workflowSteps[workflowStep]
      : workflowStep >= workflowSteps.length
        ? "Plan finalized"
        : connected
          ? "Waiting for a trip request"
          : "Connecting to agents";

  return (
    <SectionCard
      eyebrow="Live agent workflow"
      title="AI is working"
      description={tripSpec?.destination ? `Generating your trip to ${tripSpec.destination}.` : "Submit a trip request to start the pipeline."}
      icon={Bot}
      action={<StatusPill tone={connected ? "active" : "warn"}>{connected ? "Connected" : "Offline"}</StatusPill>}
    >
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-white/[0.65]">Current stage</span>
          <span className="font-semibold text-cyan-100">{currentLabel}</span>
        </div>
        <div className="mt-3">
          <ProgressBar value={workflowStep >= workflowSteps.length ? 100 : Math.max(8, (workflowStep + 1) * 11)} />
        </div>
      </div>

      <div className="space-y-3">
        {workflowSteps.map((step, index) => {
          const status =
            workflowStep >= workflowSteps.length || index < workflowStep
              ? "complete"
              : index === workflowStep && streaming
                ? "active"
                : "pending";

          return (
            <div key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StepDot status={status} index={index} />
                {index < workflowSteps.length - 1 ? <div className="h-10 w-px bg-white/10" /> : null}
              </div>
              <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-medium text-white">{step}</p>
                <p className="mt-1 text-xs leading-5 text-white/50">
                  {status === "complete"
                    ? "Completed"
                    : status === "active"
                      ? "Running now"
                      : "Queued"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function TripSnapshotCard({ spec }) {
  const stats = estimateTripStats(spec);
  const chips = [
    spec?.travelStyle,
    spec?.budgetTier,
    spec?.flightClass,
    spec?.travelers ? `${spec.travelers} traveler${spec.travelers > 1 ? "s" : ""}` : null
  ].filter(Boolean);

  return (
    <SectionCard eyebrow="Trip snapshot" title="Plan context" description="Structured request currently powering the agents." icon={MapPinned}>
      <div className="grid gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Route</p>
          <p className="mt-2 text-lg font-semibold">{[spec?.origin || "Origin", spec?.destination || "Destination"].join(" → ")}</p>
          <p className="mt-1 text-sm text-white/[0.55]">
            {spec?.departureDate ? `Depart ${formatDate(spec.departureDate)}` : "Awaiting date"}
            {spec?.returnDate ? ` · Return ${formatDate(spec.returnDate)}` : ""}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard label="Budget" value={formatCurrency(stats.budget)} detail="Target spend for this request." tone="accent" />
          <StatCard label="Daily budget" value={formatCurrency(stats.perDay)} detail="Approximate allocation per day." tone="good" />
        </div>

        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <QuickChip key={chip}>{chip}</QuickChip>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function BudgetBreakdownCard({ spec, itinerary }) {
  const allocations = deriveBudgetAllocations(spec, itinerary);
  const total = allocations.reduce((sum, item) => sum + item.amount, 0);

  return (
    <SectionCard eyebrow="Budget" title="Breakdown" description="Estimated allocation derived from your trip target." icon={Ticket}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {allocations.map((item) => (
          <div key={item.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-white/[0.82]">{item.key}</p>
              <span className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">{item.value}%</span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-cyan-100">{formatCurrency(item.amount)}</p>
            <div className="mt-3">
              <ProgressBar value={item.value} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/[0.72]">
        Estimated total: <span className="font-semibold text-cyan-100">{formatCurrency(total)}</span>
      </div>
    </SectionCard>
  );
}

function TravelInsightsCard({ spec, itinerary }) {
  const weather = extractWeatherSummary(itinerary?.weather);
  const tips = itinerary?.optimizationTips || [];

  const foodCards = [
    `Explore local specialties in ${spec?.destination || "the destination"} and ask the concierge for the neighborhood favorite.`,
    "Mix street food, one iconic restaurant, and one elevated dinner to keep the trip balanced.",
    "Time food stops around the itinerary so you avoid transport backtracking."
  ];

  const safetyCards = [
    "Keep a digital copy of IDs and tickets in the chat sidebar.",
    "Use hotel concierge or verified ride apps for late-evening transfers.",
    "Cross-check live weather and transit before every day trip."
  ];

  return (
    <SectionCard eyebrow="Travel insights" title="Weather, food, safety, and local tips" description="Actionable context around the destination." icon={SunMedium}>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Weather</p>
            {weather.length ? (
              <div className="mt-3 grid gap-2">
                {weather.map((item) => (
                  <div key={item.time || `${item.tempC}-${item.condition}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2 text-sm">
                    <span className="text-white/[0.58]">{item.time || "Forecast"}</span>
                    <span className="font-semibold text-cyan-100">
                      {item.tempC !== undefined ? `${Math.round(item.tempC)}°C` : ""}
                      {item.condition ? ` · ${item.condition}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-white/70">
                Weather details will appear when a forecast is available. Check the final plan before you travel.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Best local foods</p>
            <div className="mt-3 space-y-2 text-sm leading-7 text-white/[0.72]">
              {foodCards.map((item) => (
                <p key={item} className="rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2">{item}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Local tips</p>
            <div className="mt-3 space-y-2 text-sm leading-7 text-white/[0.72]">
              {(tips.length ? tips : [
                "Group nearby attractions into a single day to reduce transport overhead.",
                "Reserve one flexible block per day for spontaneous discoveries.",
                "Keep one lightweight backup plan for rain or crowd spikes."
              ]).map((item) => (
                <p key={item} className="rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2">{item}</p>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Safety & cultural cues</p>
            <div className="mt-3 space-y-2 text-sm leading-7 text-white/[0.72]">
              {safetyCards.map((item) => (
                <p key={item} className="rounded-2xl border border-white/10 bg-slate-950/30 px-3 py-2">{item}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function EmptyState({ connected, activeTripSpec }) {
  return (
    <div className="premium-card grid place-items-center p-8 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-cyan-400/20 to-indigo-400/[0.15] text-cyan-100">
        <Bot size={26} />
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight">
        {activeTripSpec?.destination ? "Preparing your plan" : "Start a travel conversation"}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-7 text-white/60">
        {activeTripSpec
          ? connected
            ? "The workflow is ready and will stream results in sequence."
            : "Connecting to the agent engine."
          : "Ask for a complete trip with origin, destination, dates, budget, and interests to begin."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {["7-day Japan under ₹2 lakhs", "Beach weekend from Delhi", "Family trip with premium hotels"].map((item) => (
          <QuickChip key={item}>{item}</QuickChip>
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { tripId } = useParams();
  const { state: routerState } = useLocation();

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [error, setError] = useState("");
  const [currentChatId, setCurrentChatId] = useState(routerState?.chatId ?? null);
  const [activeTripSpec, setActiveTripSpec] = useState(routerState?.tripSpec ?? null);
  const [workflowStep, setWorkflowStep] = useState(0);

  const autoStartedRef = useRef(false);
  const messagesEndRef = useRef(null);
  const { socket, connected } = useSocketTravel();

  useEffect(() => {
    const current = socket.current;
    if (!current) return;

    current.on("travel:started", () => {
      setStreaming(true);
      setWorkflowStep(0);
      setError("");
      setMessages((items) => [...items, { role: "assistant", content: "" }]);
    });

    current.on("travel:token", ({ token }) => {
      setMessages((items) => {
        const next = [...items];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, content: (last.content || "") + token };
        return next;
      });
    });

    current.on("travel:complete", ({ chatId, result }) => {
      setStreaming(false);
      setWorkflowStep(workflowSteps.length);
      setCurrentChatId(chatId);
      if (result?.tripSpec) setActiveTripSpec(result.tripSpec);
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

  useEffect(() => {
    if (!streaming) return;
    const id = window.setInterval(() => {
      setWorkflowStep((step) => Math.min(step + 1, workflowSteps.length - 1));
    }, 1100);
    return () => window.clearInterval(id);
  }, [streaming]);

  useEffect(() => {
    if (!autoStartedRef.current && connected && socket.current && activeTripSpec?.destination) {
      autoStartedRef.current = true;
      const autoPrompt = buildTripPrompt(activeTripSpec);
      setMessages([{ role: "user", content: autoPrompt }]);
      socket.current.emit("travel:plan", {
        prompt: autoPrompt,
        tripSpec: activeTripSpec,
        chatId: currentChatId,
        saveTrip: true
      });
    }
  }, [connected, activeTripSpec, currentChatId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, latestResult, streaming]);

  function buildTripPrompt(spec) {
    if (!spec?.destination) return null;
    const parts = [
      spec.origin
        ? `Plan a complete trip from ${spec.origin} to ${spec.destination}`
        : `Plan a complete trip to ${spec.destination}`
    ];
    if (spec.durationDays) parts.push(`for ${spec.durationDays} days`);
    if (spec.departureDate) parts.push(`departing on ${spec.departureDate}`);
    if (spec.returnDate) parts.push(`returning on ${spec.returnDate}`);
    if (spec.budget) parts.push(`with a total budget of ₹${Number(spec.budget).toLocaleString("en-IN")}`);
    if (spec.budgetTier) parts.push(`(${spec.budgetTier} tier)`);
    if (spec.travelers > 1) parts.push(`for ${spec.travelers} travelers`);
    if (spec.travelStyle) parts.push(`travelling as ${spec.travelStyle}`);
    if (spec.flightClass) parts.push(`in ${spec.flightClass} class`);
    if (spec.interests?.length) parts.push(`with interests in ${spec.interests.join(", ")}`);
    if (spec.hotelRating) parts.push(`preferring ${spec.hotelRating}-star hotels`);
    if (spec.dietary) parts.push(`dietary preference: ${spec.dietary}`);
    if (spec.specialRequirements) parts.push(`special requirements: ${spec.specialRequirements}`);
    return `${parts.join(", ")}.`;
  }

  const canSubmit = useMemo(
    () => prompt.trim() && connected && !streaming,
    [prompt, connected, streaming]
  );

  function submit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setMessages((items) => [...items, { role: "user", content: prompt }]);
    socket.current.emit("travel:plan", {
      prompt,
      chatId: currentChatId,
      tripSpec: activeTripSpec,
      saveTrip: true
    });
    setPrompt("");
  }

  const heading = activeTripSpec?.destination
    ? `${activeTripSpec.origin ?? "Trip"} → ${activeTripSpec.destination}`
    : tripId
      ? "Saved trip"
      : "AI travel chat";

  const subheading = connected ? "Streaming ready" : "Connecting to agent engine…";

  const budgetCardData = latestResult?.itinerary || {};
  const hasResult = Boolean(latestResult?.flights?.options?.length || latestResult?.hotels?.options?.length || budgetCardData?.dailyPlan?.length);

  return (
    <section className="relative space-y-6 text-white">
      <FloatingOrbs />

      <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_390px]">
        <div className="space-y-6">
          <div className="premium-card overflow-hidden p-6 md:p-8">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/[0.45]">Agent conversation</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">{heading}</h1>
                <p className="mt-3 text-sm leading-7 text-white/[0.62]">{subheading}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={connected ? "active" : "warn"}>{connected ? "Online" : "Offline"}</StatusPill>
                <button
                  type="button"
                  title="Export PDF"
                  onClick={() => exportTripPdf("Yatra AI Trip Plan", latestResult?.finalResponse || messages.at(-1)?.content || "")}
                  className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/80 transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
                >
                  <FileDown size={18} />
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <QuickChip><Sparkles size={12} /> Progressive reveal</QuickChip>
              <QuickChip><PlaneTakeoff size={12} /> Flights</QuickChip>
              <QuickChip><Globe2 size={12} /> Hotels</QuickChip>
              <QuickChip><CalendarDays size={12} /> Itinerary</QuickChip>
            </div>
          </div>

          <div className="premium-card p-4 md:p-5">
            <div className="mb-4 rounded-3xl border border-white/10 bg-slate-950/[0.35] p-4">
              {messages.length === 0 && !activeTripSpec ? (
                <EmptyState connected={connected} activeTripSpec={activeTripSpec} />
              ) : null}

              {messages.length === 0 && activeTripSpec ? (
                <div className="rounded-3xl border border-dashed border-white/[0.15] bg-white/5 p-6 text-sm text-white/60">
                  {connected ? "Preparing your trip plan…" : "Connecting to the backend…"}
                </div>
              ) : null}

              <div className="space-y-4">
                {messages.map((message, index) => (
                  <ChatMessage key={index} {...message} />
                ))}
                {streaming ? (
                  <div className="rounded-[28px] border border-cyan-300/[0.15] bg-cyan-400/[0.08] p-4 text-sm text-cyan-50">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-cyan-300/[0.15]">
                        <Bot size={15} />
                      </div>
                      <div>
                        <p className="font-semibold">AI is composing your travel plan</p>
                        <p className="text-xs text-cyan-100/70">Agents are coordinating flights, hotels, itinerary, and budget.</p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {error ? (
                  <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</p>
                ) : null}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {latestResult || streaming ? (
              <div className="space-y-6">
                {streaming && !hasResult ? <LoadingSkeleton /> : null}
                <FlightCards flights={latestResult?.flights} />
                <HotelCards hotels={latestResult?.hotels} />
                <ItineraryTimeline itinerary={latestResult?.itinerary} />
                <BudgetBreakdownCard spec={activeTripSpec} itinerary={latestResult?.itinerary} />
                <TravelInsightsCard spec={activeTripSpec} itinerary={latestResult?.itinerary} />
              </div>
            ) : null}
          </div>

          <div className="premium-card overflow-hidden p-4 md:p-5">
            <form onSubmit={submit} className="grid gap-3">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="premium-input min-h-[96px] resize-none lg:col-span-1"
                  placeholder={
                    activeTripSpec
                      ? "Ask a follow-up: reduce budget, upgrade hotels, add adventure activities..."
                      : "Plan a complete 7-day Japan trip under ₹2 lakhs..."
                  }
                />
                <VoiceInputButton onTranscript={(text) => setPrompt((value) => `${value} ${text}`.trim())} />
                <button disabled={!canSubmit} className="premium-button-primary h-12 self-start disabled:cursor-not-allowed disabled:opacity-40">
                  <SendHorizonal size={16} />
                  Send
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  "Make it cheaper",
                  "Upgrade the hotels",
                  "Add more food spots",
                  "Reduce travel time"
                ].map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setPrompt(item)}
                    className="premium-chip"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <WorkflowPanel streaming={streaming} connected={connected} workflowStep={workflowStep} tripSpec={activeTripSpec} />
          <TripSnapshotCard spec={activeTripSpec} />

          <SectionCard eyebrow="Result status" title="What is ready" icon={ShieldCheck}>
            <div className="space-y-3">
              {[
                ["Flights", latestResult?.flights?.options?.length || 0],
                ["Hotels", latestResult?.hotels?.options?.length || 0],
                ["Itinerary days", latestResult?.itinerary?.dailyPlan?.length || 0]
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                  <span className="text-white/[0.65]">{label}</span>
                  <span className="font-semibold text-cyan-100">{value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Controls" title="Quick actions" icon={ArrowUpRight}>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setPrompt("Add a more luxurious hotel selection")}
                className="premium-button-secondary justify-between"
              >
                Upgrade stay
                <ArrowUpRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPrompt("Trim the budget by 15% while keeping the trip premium")}
                className="premium-button-secondary justify-between"
              >
                Trim budget
                <ArrowUpRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPrompt("Add one unique local experience each day")}
                className="premium-button-secondary justify-between"
              >
                Add experiences
                <ArrowUpRight size={16} />
              </button>
            </div>
          </SectionCard>
        </aside>
      </div>
    </section>
  );
}
