import { CalendarDays, Compass, Footprints, MapPinned, MoonStar, Sunrise, Sunset } from "lucide-react";
import { SectionCard, StatusPill, formatCurrency, classNames } from "./TravelUI.jsx";

function DayBlock({ day, index }) {
  const isFirst = index === 0;
  const estimate = day.dailySpend || day.budgetNotes || day.estimatedDailySpend;
  const accent = index % 2 === 0 ? "from-cyan-400/20 to-indigo-400/10" : "from-emerald-400/20 to-cyan-400/10";

  return (
    <details className="group rounded-[28px] border border-white/10 bg-white/5 open:bg-white/[0.07]">
      <summary className="cursor-pointer list-none p-5 outline-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/[0.45]">Day {day.day}</p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-white">{day.theme || `Day ${day.day}`}</h3>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill tone={isFirst ? "success" : "neutral"}>{isFirst ? "Hero day" : "Open"}</StatusPill>
            <Compass size={18} className="text-cyan-300" />
          </div>
        </div>
      </summary>

      <div className="border-t border-white/10 px-5 pb-5">
        <div className="grid gap-3 xl:grid-cols-3">
          {[
            { icon: Sunrise, label: "Morning", value: day.morning },
            { icon: SunIcon, label: "Afternoon", value: day.afternoon },
            { icon: MoonStar, label: "Evening", value: day.evening }
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className={classNames("rounded-2xl border border-white/10 bg-gradient-to-br p-4", accent)}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                <Icon size={14} className="text-cyan-200" />
                {label}
              </div>
              <p className="mt-3 text-sm leading-6 text-white/[0.78]">{value || "Activity details will be generated here."}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Food</p>
            <p className="mt-2 text-sm leading-6 text-white/[0.76]">{day.food || "Local food recommendation based on your destination."}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Transport</p>
            <p className="mt-2 text-sm leading-6 text-white/[0.76]">{day.transport || "Optimized local travel suggestions."}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Spend</p>
            <p className="mt-2 text-sm font-semibold text-cyan-100">{estimate || "Budget-aware estimate included in the plan"}</p>
          </div>
        </div>
      </div>
    </details>
  );
}

function SunIcon(props) {
  return <Sunset {...props} />;
}

export default function ItineraryTimeline({ itinerary }) {
  const days = itinerary?.dailyPlan || [];
  if (!days.length) return null;

  return (
    <SectionCard
      eyebrow="Hero itinerary"
      title="Day-by-day travel guide"
      description="A premium, progressive itinerary presentation with expandable days and budget-aware context."
      icon={MapPinned}
      action={<StatusPill tone="active">{days.length} days</StatusPill>}
    >
      <div className="space-y-4">
        {days.map((day, index) => (
          <DayBlock key={day.day || index} day={day} index={index} />
        ))}
      </div>

      {itinerary?.budgetBreakdown ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(itinerary.budgetBreakdown).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">{key}</p>
              <p className="mt-2 text-sm font-semibold text-white/[0.85]">{value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}
