import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, ExternalLink, Trash2, MapPinned, PlaneTakeoff, CalendarDays, Sparkles } from "lucide-react";
import { api } from "../services/api.js";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import { FloatingOrbs, SectionCard, StatCard, StatusPill, classNames, formatCurrency, formatDate } from "../components/TravelUI.jsx";

function TripCard({ trip, onOpen, onShare, onDelete }) {
  const spec = trip.tripSpec || {};
  const range = [spec.origin, spec.destination].filter(Boolean).join(" → ") || trip.destination;
  const dateLabel = [spec.departureDate, spec.returnDate].filter(Boolean).map(formatDate).join(" — ");
  const summary = trip.finalResponse?.slice(0, 220) || "Your generated travel plan will appear here once the agents complete.";
  const budget = formatCurrency(trip.budget, trip.budget || "Flexible");
  const chips = [
    spec.travelStyle,
    spec.budgetTier,
    spec.flightClass,
    spec.travelers ? `${spec.travelers} traveler${spec.travelers > 1 ? "s" : ""}` : null
  ].filter(Boolean);

  return (
    <article className="premium-card overflow-hidden transition duration-300 hover:-translate-y-1">
      <div className="border-b border-white/10 bg-gradient-to-br from-cyan-400/[0.12] to-indigo-400/[0.08] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/[0.45]">Saved trip</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{trip.destination}</h2>
            <p className="mt-2 text-sm text-white/[0.65]">{range}</p>
          </div>
          <StatusPill tone="success">Live</StatusPill>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="premium-chip">
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Budget</p>
            <p className="mt-2 text-xl font-semibold text-cyan-100">{budget}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Dates</p>
            <p className="mt-2 text-sm font-medium text-white/[0.85]">{dateLabel || "Flexible dates"}</p>
          </div>
        </div>

        <p className="line-clamp-5 text-sm leading-7 text-white/70">{summary}</p>

        <div className="flex flex-wrap gap-2">
          <button onClick={onOpen} className="premium-button-primary">
            <ExternalLink size={16} />
            Open plan
          </button>
          <button onClick={onShare} className="premium-button-secondary">
            <Copy size={16} />
            Share
          </button>
          <button onClick={onDelete} className="premium-button-secondary border-red-400/20 text-red-100 hover:bg-red-500/10">
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const navigate = useNavigate();

  async function loadTrips() {
    setLoading(true);
    try {
      const { data } = await api.get("/trips");
      setTrips(data.trips);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load trips");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrips();
  }, []);

  async function removeTrip(id) {
    await api.delete(`/trips/${id}`);
    setTrips((items) => items.filter((trip) => trip._id !== id));
  }

  async function shareTrip(id) {
    const { data } = await api.post(`/trips/${id}/share`);
    await navigator.clipboard.writeText(`${window.location.origin}${data.shareUrl}`);
    setShareStatus("Share link copied to clipboard");
    window.setTimeout(() => setShareStatus(""), 2500);
  }

  const stats = useMemo(() => ({
    total: trips.length,
    latest: trips[0]?.destination || "No trips yet",
    withBudget: trips.filter((trip) => trip.budget && trip.budget !== "Flexible").length
  }), [trips]);

  return (
    <section className="relative space-y-6 text-white">
      <FloatingOrbs />
      <div className="relative grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="premium-card overflow-hidden p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/[0.45]">Saved journeys</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight">Trip dashboard</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/[0.65]">
                  Review generated itineraries, revisit the chat, share a link, or delete a plan without leaving the cockpit.
                </p>
              </div>
              <StatusPill tone="active">{trips.length} trips stored</StatusPill>
            </div>

            {shareStatus ? (
              <p className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{shareStatus}</p>
            ) : null}
          </div>

          {loading ? <LoadingSkeleton /> : null}
          {error && <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</p>}

          {!loading && !trips.length ? (
            <div className="premium-card grid place-items-center p-10 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-cyan-400/20 to-indigo-400/[0.15] text-cyan-100">
                <PlaneTakeoff size={26} />
              </div>
              <h2 className="mt-5 text-2xl font-semibold">No trips saved yet</h2>
              <p className="mt-2 max-w-md text-sm leading-7 text-white/[0.62]">
                Start a plan in the chat and the agent workflow will save a polished trip summary here.
              </p>
              <button onClick={() => navigate("/app/plan")} className="premium-button-primary mt-6">
                <Sparkles size={16} />
                Plan a trip
              </button>
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-2">
            {trips.map((trip) => (
              <TripCard
                key={trip._id}
                trip={trip}
                onOpen={() =>
                  navigate(`/app/chat/${trip._id}`, {
                    state: { tripSpec: trip.tripSpec, chatId: trip.chatId }
                  })
                }
                onShare={() => shareTrip(trip._id)}
                onDelete={() => removeTrip(trip._id)}
              />
            ))}
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <SectionCard
            eyebrow="Overview"
            title="Saved trip metrics"
            description="A quick pulse on your stored plans."
            icon={MapPinned}
          >
            <div className="grid gap-3">
              <StatCard label="Total trips" value={stats.total} detail="All saved plans in the account." tone="accent" />
              <StatCard label="Latest destination" value={stats.latest} detail="Most recent itinerary in the vault." tone="good" />
              <StatCard label="Budgeted trips" value={stats.withBudget} detail="Trips with an explicit budget target." tone="warm" />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Tips"
            title="How this dashboard works"
            description="Everything is designed to keep the agentic experience feeling premium."
          >
            <div className="space-y-3 text-sm leading-7 text-white/70">
              <p>Open any trip to resume the chat thread and tweak the plan.</p>
              <p>Use share links for collaborators or family members.</p>
              <p>Saved trips preserve the itinerary text and agent-generated context.</p>
            </div>
          </SectionCard>
        </aside>
      </div>
    </section>
  );
}
