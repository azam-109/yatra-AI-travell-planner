import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const INTERESTS  = ["Beaches","Adventure","Nature","Nightlife","Food","Culture","Shopping","Relaxation"];
const STYLES     = ["solo","couple","family","friends"];
const TIERS      = ["budget","mid-range","luxury"];
const CLASSES    = ["economy","business","first"];
const RATINGS    = ["Any","3","4","5"];

const DEFAULTS = {
  origin: "", destination: "", departureDate: "", returnDate: "",
  durationDays: "", budget: "", travelers: 1,
  travelStyle: "solo", budgetTier: "mid-range",
  hotelType: "", flightClass: "economy", interests: [],
  hotelRating: "", dietary: "", specialRequirements: ""
};

// ─── Small shared primitives ──────────────────────────────────────────────────

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-coral">*</span>}
      </span>
      {children}
    </label>
  );
}

function Input({ value, onChange, type = "text", placeholder, min, max }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-reef focus:outline-none focus:ring-1 focus:ring-reef"
    />
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm font-semibold capitalize transition-colors ${
        active
          ? "bg-reef text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Step 1: Basic Details ────────────────────────────────────────────────────

function BasicDetails({ data, onChange, onNext }) {
  const valid = data.origin.trim() && data.destination.trim() && data.departureDate;

  return (
    <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From" required>
          <Input value={data.origin} onChange={v => onChange({ origin: v })} placeholder="Delhi" />
        </Field>
        <Field label="To" required>
          <Input value={data.destination} onChange={v => onChange({ destination: v })} placeholder="Goa" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Departure Date" required>
          <Input type="date" value={data.departureDate} onChange={v => onChange({ departureDate: v })} />
        </Field>
        <Field label="Return Date">
          <Input type="date" value={data.returnDate} onChange={v => onChange({ returnDate: v })} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Duration (days)">
          <Input type="number" value={data.durationDays} onChange={v => onChange({ durationDays: v })}
            placeholder="7" min={1} max={90} />
        </Field>
        <Field label="Budget (₹)">
          <Input type="number" value={data.budget} onChange={v => onChange({ budget: v })}
            placeholder="30000" min={0} />
        </Field>
        <Field label="Travelers">
          <Input type="number" value={data.travelers} onChange={v => onChange({ travelers: v })}
            min={1} max={20} />
        </Field>
      </div>

      <button
        type="button"
        disabled={!valid}
        onClick={onNext}
        className="mt-2 w-full rounded-lg bg-reef py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
      >
        Next: Preferences →
      </button>
    </div>
  );
}

// ─── Step 2: Preferences ──────────────────────────────────────────────────────

function Preferences({ data, onChange, onBack, onSubmit, loading }) {
  function toggleInterest(interest) {
    const key = interest.toLowerCase();
    onChange({
      interests: data.interests.includes(key)
        ? data.interests.filter(i => i !== key)
        : [...data.interests, key]
    });
  }

  return (
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">Travel Style</p>
        <div className="flex flex-wrap gap-2">
          {STYLES.map(s => (
            <Chip key={s} label={s} active={data.travelStyle === s}
              onClick={() => onChange({ travelStyle: s })} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">Budget Tier</p>
        <div className="flex flex-wrap gap-2">
          {TIERS.map(t => (
            <Chip key={t} label={t} active={data.budgetTier === t}
              onClick={() => onChange({ budgetTier: t })} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">Interests</p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(interest => (
            <Chip key={interest} label={interest}
              active={data.interests.includes(interest.toLowerCase())}
              onClick={() => toggleInterest(interest)} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Flight Class">
          <select
            value={data.flightClass}
            onChange={e => onChange({ flightClass: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-reef focus:outline-none focus:ring-1 focus:ring-reef"
          >
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Hotel Rating">
          <select
            value={data.hotelRating}
            onChange={e => onChange({ hotelRating: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-reef focus:outline-none focus:ring-1 focus:ring-reef"
          >
            {RATINGS.map(r => <option key={r} value={r === "Any" ? "" : r}>{r === "Any" ? "Any rating" : `${r} Star`}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Dietary Preferences">
        <Input value={data.dietary} onChange={v => onChange({ dietary: v })}
          placeholder="Vegetarian, Jain, Halal…" />
      </Field>

      <Field label="Special Requirements">
        <textarea
          rows={2}
          value={data.specialRequirements}
          onChange={e => onChange({ specialRequirements: e.target.value })}
          placeholder="Wheelchair access, travelling with infant…"
          className="w-full resize-none rounded border border-slate-300 px-3 py-2 text-sm focus:border-reef focus:outline-none focus:ring-1 focus:ring-reef"
        />
      </Field>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 rounded-lg bg-reef py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        >
          {loading ? "Creating your plan…" : "Generate Trip Plan →"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TripFormPage() {
  const navigate  = useNavigate();
  const [step, setStep]       = useState(1);
  const [formData, setFormData] = useState(DEFAULTS);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState("");

  function update(fields) {
    setFormData(prev => ({ ...prev, ...fields }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/trips", {
        ...formData,
        budget:      formData.budget      ? Number(formData.budget)      : undefined,
        durationDays: formData.durationDays ? Number(formData.durationDays) : undefined,
        travelers:   Number(formData.travelers),
        hotelRating: formData.hotelRating  ? Number(formData.hotelRating) : undefined
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
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-ink">Plan a New Trip</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fill in your details and the AI will build a complete itinerary.
        </p>

        {/* Step bar */}
        <div className="mt-5 flex items-center gap-3">
          {[1, 2].map(s => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                s < step  ? "bg-reef text-white" :
                s === step ? "bg-reef text-white" :
                             "bg-slate-200 text-slate-400"
              }`}>
                {s < step ? "✓" : s}
              </div>
              <span className={`text-sm font-semibold ${s === step ? "text-ink" : "text-slate-400"}`}>
                {s === 1 ? "Trip Details" : "Preferences"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      {step === 1 && (
        <BasicDetails data={formData} onChange={update} onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <Preferences
          data={formData}
          onChange={update}
          onBack={() => setStep(1)}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}