import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Compass, Globe2, PlaneTakeoff, Sparkles, ShieldCheck, WandSparkles } from "lucide-react";
import { api } from "../services/api.js";
import { FloatingOrbs, ProgressBar, QuickChip, SectionCard, StatCard, StatusPill, estimateTripStats, formatCurrency, formatDate, classNames } from "../components/TravelUI.jsx";

const INTERESTS = ["Beaches", "Adventure", "Nature", "Nightlife", "Food", "Culture", "Shopping", "Relaxation"];
const STYLES = ["solo", "couple", "family", "friends"];
const TIERS = ["budget", "mid-range", "luxury"];
const CLASSES = ["economy", "business", "first"];
const RATINGS = ["Any", "3", "4", "5"];

const DEFAULTS = {
  origin: "",
  destination: "",
  departureDate: "",
  returnDate: "",
  durationDays: "",
  budget: "",
  travelers: 1,
  travelStyle: "solo",
  budgetTier: "mid-range",
  hotelType: "",
  flightClass: "economy",
  interests: [],
  hotelRating: "",
  dietary: "",
  specialRequirements: ""
};

function Field({ label, required, children, hint }) {
  return (
    <label className="block">
      <span className="premium-label">
        {label}
        {required && <span className="ml-1 text-cyan-300">*</span>}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-xs text-white/[0.45]">{hint}</span> : null}
    </label>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "rounded-full border px-3 py-2 text-sm font-medium transition duration-200",
        active
          ? "border-cyan-300/30 bg-cyan-400/[0.15] text-cyan-100 shadow-lg shadow-cyan-500/10"
          : "border-white/10 bg-white/5 text-white/70 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
      )}
    >
      {label}
    </button>
  );
}

function BasicDetails({ data, onChange, onNext }) {
  const valid = data.origin.trim() && data.destination.trim() && data.departureDate;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="From" required hint="Origin city or airport">
          <input className="premium-input" value={data.origin} onChange={(e) => onChange({ origin: e.target.value })} placeholder="Delhi" />
        </Field>
        <Field label="To" required hint="Destination city">
          <input className="premium-input" value={data.destination} onChange={(e) => onChange({ destination: e.target.value })} placeholder="Goa" />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Departure date" required>
          <input type="date" className="premium-input" value={data.departureDate} onChange={(e) => onChange({ departureDate: e.target.value })} />
        </Field>
        <Field label="Return date">
          <input type="date" className="premium-input" value={data.returnDate} onChange={(e) => onChange({ returnDate: e.target.value })} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Duration (days)">
          <input type="number" min={1} max={90} className="premium-input" value={data.durationDays} onChange={(e) => onChange({ durationDays: e.target.value })} placeholder="7" />
        </Field>
        <Field label="Budget (₹)">
          <input type="number" min={0} className="premium-input" value={data.budget} onChange={(e) => onChange({ budget: e.target.value })} placeholder="30000" />
        </Field>
        <Field label="Travelers">
          <input type="number" min={1} max={20} className="premium-input" value={data.travelers} onChange={(e) => onChange({ travelers: e.target.value })} />
        </Field>
      </div>

      <button
        type="button"
        disabled={!valid}
        onClick={onNext}
        className="premium-button-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next: preferences
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

function Preferences({ data, onChange, onBack, onSubmit, loading }) {
  function toggleInterest(interest) {
    const key = interest.toLowerCase();
    onChange({
      interests: data.interests.includes(key)
        ? data.interests.filter((item) => item !== key)
        : [...data.interests, key]
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="premium-label">Travel style</p>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((style) => (
            <Chip key={style} label={style} active={data.travelStyle === style} onClick={() => onChange({ travelStyle: style })} />
          ))}
        </div>
      </div>

      <div>
        <p className="premium-label">Budget tier</p>
        <div className="flex flex-wrap gap-2">
          {TIERS.map((tier) => (
            <Chip key={tier} label={tier} active={data.budgetTier === tier} onClick={() => onChange({ budgetTier: tier })} />
          ))}
        </div>
      </div>

      <div>
        <p className="premium-label">Interests</p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => (
            <Chip key={interest} label={interest} active={data.interests.includes(interest.toLowerCase())} onClick={() => toggleInterest(interest)} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Flight class">
          <select className="premium-input" value={data.flightClass} onChange={(e) => onChange({ flightClass: e.target.value })}>
            {CLASSES.map((choice) => (
              <option key={choice} value={choice} className="bg-slate-950">{choice}</option>
            ))}
          </select>
        </Field>

        <Field label="Hotel rating">
          <select className="premium-input" value={data.hotelRating} onChange={(e) => onChange({ hotelRating: e.target.value === "Any" ? "" : e.target.value })}>
            {RATINGS.map((choice) => (
              <option key={choice} value={choice} className="bg-slate-950">
                {choice === "Any" ? "Any rating" : `${choice} Star`}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Dietary preferences" hint="Vegetarian, Jain, Halal, etc.">
        <input className="premium-input" value={data.dietary} onChange={(e) => onChange({ dietary: e.target.value })} placeholder="Vegetarian" />
      </Field>

      <Field label="Special requirements">
        <textarea
          rows={3}
          className="premium-input resize-none"
          value={data.specialRequirements}
          onChange={(e) => onChange({ specialRequirements: e.target.value })}
          placeholder="Wheelchair access, travelling with infant, early check-in..."
        />
      </Field>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onBack} className="premium-button-secondary flex-1">
          Back
        </button>
        <button type="button" onClick={onSubmit} disabled={loading} className="premium-button-primary flex-1 disabled:opacity-40">
          {loading ? "Creating your plan…" : "Generate trip plan"}
          <WandSparkles size={16} />
        </button>
      </div>
    </div>
  );
}

function TripSummary({ formData }) {
  const stats = estimateTripStats(formData);
  const hasRoute = formData.origin || formData.destination;
  const days = Number(formData.durationDays) || stats.days;
  const budget = Number(formData.budget) || stats.budget;

  return (
    <div className="space-y-4">
      <SectionCard eyebrow="Trip snapshot" title="What you are planning" description="Live summary from the form." icon={Compass}>
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Route</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {hasRoute ? [formData.origin || "Origin", formData.destination || "Destination"].join(" → ") : "Add origin and destination"}
            </p>
            <p className="mt-1 text-sm text-white/[0.55]">
              {formData.departureDate ? `Depart ${formatDate(formData.departureDate)}` : "Select dates to continue"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Budget" value={formatCurrency(budget)} detail="Approximate target spend." tone="accent" />
            <StatCard label="Days" value={days} detail="Trip duration." tone="good" />
            <StatCard label="Travelers" value={stats.travelers} detail="People included in the plan." tone="warm" />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/[0.45]">
              <span>Budget readiness</span>
              <span>{Math.min(100, Math.round((Number(formData.budget) || 0) / Math.max(1, stats.perDay * days) * 100)) || 0}%</span>
            </div>
            <ProgressBar value={Math.min(100, Number(formData.budget) ? 78 : 32)} />
          </div>
        </div>
      </SectionCard>

      <SectionCard eyebrow="Included" title="Planning inputs">
        <div className="flex flex-wrap gap-2">
          <QuickChip><PlaneTakeoff size={12} /> {formData.flightClass}</QuickChip>
          <QuickChip><Globe2 size={12} /> {formData.budgetTier}</QuickChip>
          <QuickChip><ShieldCheck size={12} /> {formData.travelStyle}</QuickChip>
          <QuickChip><Sparkles size={12} /> {formData.interests.length || 0} interests</QuickChip>
        </div>
      </SectionCard>
    </div>
  );
}

export default function TripFormPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(fields) {
    setFormData((prev) => ({ ...prev, ...fields }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/trips", {
        ...formData,
        budget: formData.budget ? Number(formData.budget) : undefined,
        durationDays: formData.durationDays ? Number(formData.durationDays) : undefined,
        travelers: Number(formData.travelers),
        hotelRating: formData.hotelRating ? Number(formData.hotelRating) : undefined
      });
      navigate(`/app/chat/${data.trip._id}`, {
        state: { tripSpec: data.trip.tripSpec, chatId: data.chatId }
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not create trip. Please try again.");
      setLoading(false);
    }
  }

  return (
    <section className="relative space-y-6 text-white">
      <FloatingOrbs />

      <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_380px]">
        <div className="space-y-6">
          <div className="premium-card overflow-hidden p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/[0.45]">Trip creation</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">Plan a new trip</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/[0.65]">
                  Fill in your route and preferences. The AI will transform the request into a premium trip dashboard with streaming results.
                </p>
              </div>
              <StatusPill tone="active">Step {step} of 2</StatusPill>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <StatCard label="Mode" value="Agentic" detail="Multi-agent planning flow." tone="accent" />
              <StatCard label="Output" value="Dashboard" detail="Flights, hotels, itinerary, insights." tone="good" />
              <StatCard label="Loading" value="Staged" detail="Progressively revealed plan generation." tone="warm" />
            </div>
          </div>

          <div className="premium-card overflow-hidden p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-3">
                  <div
                    className={classNames(
                      "grid h-9 w-9 place-items-center rounded-full text-sm font-semibold transition",
                      s < step || s === step
                        ? "bg-cyan-400 text-slate-950"
                        : "border border-white/10 bg-white/5 text-white/[0.45]"
                    )}
                  >
                    {s < step ? "✓" : s}
                  </div>
                  <div className="mr-1">
                    <p className={classNames("text-sm font-semibold", s === step ? "text-white" : "text-white/[0.45]")}>
                      {s === 1 ? "Trip details" : "Preferences"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {step === 1 ? (
              <BasicDetails data={formData} onChange={update} onNext={() => setStep(2)} />
            ) : (
              <Preferences
                data={formData}
                onChange={update}
                onBack={() => setStep(1)}
                onSubmit={handleSubmit}
                loading={loading}
              />
            )}

            {error ? (
              <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</p>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <TripSummary formData={formData} />

          <SectionCard eyebrow="Good to know" title="What happens next">
            <div className="space-y-3 text-sm leading-7 text-white/70">
              {[
                "The route and dates are sent to the backend trip creator unchanged.",
                "The chat opens automatically once the trip record is created.",
                "Agents then stream flights, hotels, itinerary, and budget details in sequence."
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </aside>
      </div>
    </section>
  );
}
