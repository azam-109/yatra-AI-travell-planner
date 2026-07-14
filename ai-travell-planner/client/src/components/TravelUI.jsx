import { ChevronRight, Sparkles } from "lucide-react";

export const workflowSteps = [
  "Understanding Trip Requirements",
  "Resolving Airport Codes",
  "Searching Flights",
  "Finding Hotels",
  "Researching Destination",
  "Creating Itinerary",
  "Optimizing Budget",
  "Finalizing Travel Plan"
];

export function classNames(...items) {
  return items.filter(Boolean).join(" ");
}

export function formatCurrency(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    if (/₹|INR/i.test(trimmed)) return trimmed;
    const numeric = Number(trimmed.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(numeric) && numeric > 0) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }).format(numeric);
    }
    return trimmed;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(numeric);
}

export function formatDate(value) {
  if (!value) return "Flexible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export function formatRoute(route, origin, destination) {
  if (route) return route;
  if (origin && destination) return `${origin} → ${destination}`;
  if (destination) return `To ${destination}`;
  return "Route details";
}

export function SectionCard({ eyebrow, title, description, icon: Icon, action, children, className = "" }) {
  return (
    <section className={classNames("premium-card relative overflow-hidden", className)}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div>
          {eyebrow && (
            <p className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/[0.65]">
              <Sparkles size={11} />
              {eyebrow}
            </p>
          )}
          <div className="mt-1 flex items-center gap-2">
            {Icon ? <Icon size={18} className="text-cyan-300" /> : null}
            <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
          </div>
          {description && <p className="mt-1 text-sm leading-6 text-white/[0.62]">{description}</p>}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export function StatusPill({ tone = "neutral", children }) {
  const tones = {
    neutral: "border-white/10 bg-white/5 text-white/75",
    active: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
    success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
    warn: "border-amber-400/30 bg-amber-400/10 text-amber-100"
  };

  return (
    <span className={classNames("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", tones[tone] || tones.neutral)}>
      {children}
    </span>
  );
}

export function ProgressBar({ value = 0, className = "" }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={classNames("h-2 overflow-hidden rounded-full bg-white/[0.08]", className)} aria-hidden="true">
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300 transition-all duration-700"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

export function StatCard({ label, value, detail, tone = "neutral" }) {
  const tones = {
    neutral: "from-white/[0.08] to-white/[0.03] border-white/10",
    accent: "from-cyan-400/[0.18] to-white/[0.03] border-cyan-400/20",
    warm: "from-amber-400/[0.18] to-white/[0.03] border-amber-400/20",
    good: "from-emerald-400/[0.18] to-white/[0.03] border-emerald-400/20"
  };
  return (
    <div className={classNames("rounded-3xl border bg-gradient-to-br p-4 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur", tones[tone] || tones.neutral)}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/[0.55]">{label}</p>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</div>
      {detail ? <p className="mt-1 text-sm leading-6 text-white/[0.65]">{detail}</p> : null}
    </div>
  );
}

export function QuickChip({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/80">
      {children}
    </span>
  );
}

export function FloatingOrbs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />
    </div>
  );
}

export function SectionLink({ children, ...props }) {
  return (
    <a
      {...props}
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/10 hover:text-white",
        props.className
      )}
    >
      {children}
      <ChevronRight size={14} />
    </a>
  );
}

export function asList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value].filter(Boolean);
}

export function deriveBudgetAllocations(spec = {}, itinerary = {}) {
  const baseBudget = Number(spec?.budget) || Math.max(60000, (Number(spec?.durationDays) || 5) * 15000);
  const tier = spec?.budgetTier || "mid-range";
  const base = {
    flights: 28,
    hotels: 34,
    food: 12,
    transport: 8,
    activities: 18
  };

  const adjustments = {
    budget: { flights: 24, hotels: 30, food: 14, transport: 10, activities: 22 },
    "mid-range": base,
    luxury: { flights: 24, hotels: 42, food: 10, transport: 7, activities: 17 }
  };

  const distribution = adjustments[tier] || base;
  const items = [
    { key: "Flights", value: distribution.flights },
    { key: "Hotels", value: distribution.hotels },
    { key: "Food", value: distribution.food },
    { key: "Transport", value: distribution.transport },
    { key: "Activities", value: distribution.activities }
  ].map((item) => ({
    ...item,
    amount: Math.round((baseBudget * item.value) / 100),
  }));

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  if (total > 0) {
    items[items.length - 1].amount += baseBudget - total;
  }
  return items;
}

export function estimateTripStats(spec = {}) {
  const travelers = Math.max(1, Number(spec?.travelers) || 1);
  const days = Math.max(1, Number(spec?.durationDays) || 5);
  const budget = Number(spec?.budget) || days * 15000;
  return {
    travelers,
    days,
    budget,
    perDay: Math.round(budget / days),
    perTraveler: Math.round(budget / travelers)
  };
}

export function extractWeatherSummary(weather) {
  if (!weather) return [];
  if (Array.isArray(weather.summary)) return weather.summary.slice(0, 4);
  if (Array.isArray(weather)) return weather.slice(0, 4);
  return [];
}
