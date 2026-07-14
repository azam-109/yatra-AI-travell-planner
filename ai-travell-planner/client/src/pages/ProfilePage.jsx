import { useMemo, useState } from "react";
import { Check, UserRound, Sparkles } from "lucide-react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { FloatingOrbs, QuickChip, SectionCard, StatCard, StatusPill } from "../components/TravelUI.jsx";

const selectOptions = {
  travelStyle: ["balanced", "solo", "couple", "family", "friends", "luxury"],
  hotelPreference: ["comfortable mid-range", "boutique", "luxury", "budget-friendly", "family-friendly"],
  foodPreference: ["local cuisine", "vegetarian", "jain", "halal", "fine dining", "street food"],
  pace: ["relaxed", "moderate", "packed", "custom"]
};

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    travelStyle: user?.preferences?.travelStyle || "balanced",
    hotelPreference: user?.preferences?.hotelPreference || "comfortable mid-range",
    foodPreference: user?.preferences?.foodPreference || "local cuisine",
    pace: user?.preferences?.pace || "moderate"
  });
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      const { data } = await api.put("/profile", {
        name: form.name,
        preferences: {
          travelStyle: form.travelStyle,
          hotelPreference: form.hotelPreference,
          foodPreference: form.foodPreference,
          pace: form.pace
        }
      });
      setUser(data.user);
      setStatus("Profile saved");
    } finally {
      setSaving(false);
    }
  }

  const summary = useMemo(() => [
    `Travel style: ${form.travelStyle}`,
    `Hotel preference: ${form.hotelPreference}`,
    `Food preference: ${form.foodPreference}`,
    `Pace: ${form.pace}`
  ], [form]);

  return (
    <section className="relative space-y-6 text-white">
      <FloatingOrbs />
      <div className="relative grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="premium-card overflow-hidden p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/[0.45]">Profile</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">Personalize future trips</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/[0.65]">
                These preferences are injected into future planning runs so the AI can tailor hotels, pace, and dining suggestions.
              </p>
            </div>
            <StatusPill tone="active">Personal memory</StatusPill>
          </div>

          <form onSubmit={submit} className="mt-8 grid gap-4">
            <label>
              <span className="premium-label">Name</span>
              <input
                className="premium-input"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(selectOptions).map(([key, options]) => (
                <label key={key}>
                  <span className="premium-label">{key.replace(/([A-Z])/g, " $1")}</span>
                  <select
                    className="premium-input"
                    value={form[key]}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  >
                    {options.map((option) => (
                      <option key={option} value={option} className="bg-slate-950">
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button className="premium-button-primary" disabled={saving}>
                <Check size={16} />
                {saving ? "Saving..." : "Save preferences"}
              </button>
            </div>

            {status && (
              <p className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {status}
              </p>
            )}
          </form>
        </div>

        <aside className="space-y-4">
          <SectionCard eyebrow="Preview" title="Preference snapshot" icon={UserRound} description="This is what the planner will remember.">
            <div className="space-y-3 text-sm leading-7 text-white/[0.72]">
              {summary.map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <Sparkles size={14} className="mt-1 text-cyan-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Why it matters" title="Better personalization">
            <div className="space-y-3">
              {[
                "Hotel recommendations tilt toward your preferred style and budget.",
                "Trip pacing adapts to how much activity you like each day.",
                "Dining suggestions can align with dietary needs and cuisine preferences."
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/[0.72]">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-cyan-400/10 text-cyan-200">
                    <Check size={14} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </SectionCard>
        </aside>
      </div>
    </section>
  );
}
