import { MapPinned } from "lucide-react";

export default function ItineraryTimeline({ itinerary }) {
  const days = itinerary?.dailyPlan || [];
  if (!days.length) return null;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
        <MapPinned size={20} /> Day-wise Itinerary
      </h2>
      <div className="space-y-3">
        {days.map((day) => (
          <article key={day.day} className="rounded border border-slate-200 bg-white p-4">
            <p className="font-black">
              Day {day.day}: {day.theme}
            </p>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
              <p><span className="font-bold">Morning:</span> {day.morning}</p>
              <p><span className="font-bold">Afternoon:</span> {day.afternoon}</p>
              <p><span className="font-bold">Evening:</span> {day.evening}</p>
            </div>
            <p className="mt-3 text-sm text-slate-600">{day.food} · {day.transport}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
