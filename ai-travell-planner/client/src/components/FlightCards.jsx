import { PlaneTakeoff } from "lucide-react";

export default function FlightCards({ flights }) {
  const options = flights?.options || [];
  if (!options.length) return null;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
        <PlaneTakeoff size={20} /> Flights
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        {options.slice(0, 4).map((flight, index) => (
          <article key={`${flight.flightNumber}-${index}`} className="rounded border border-slate-200 bg-white p-4">
            <p className="font-bold">{flight.airline || "Recommended carrier"}</p>
            <p className="text-sm text-slate-600">{flight.route}</p>
            <p className="mt-2 text-sm">{flight.departure || flight.recommendation}</p>
            <p className="mt-2 font-semibold text-reef">{flight.estimatedPrice || "Check live fare"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
