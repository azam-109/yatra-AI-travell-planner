import { Hotel } from "lucide-react";

export default function HotelCards({ hotels }) {
  const options = hotels?.options || [];
  if (!options.length) return null;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
        <Hotel size={20} /> Hotels
      </h2>
      <div className="grid gap-3 md:grid-cols-3">
        {options.slice(0, 6).map((hotel, index) => (
          <article key={`${hotel.name}-${index}`} className="rounded border border-slate-200 bg-white p-4">
            <p className="font-bold">{hotel.name || "Curated stay"}</p>
            <p className="text-sm text-slate-600">{hotel.location}</p>
            <p className="mt-2 text-sm">{hotel.reason}</p>
            <p className="mt-2 font-semibold text-reef">{hotel.priceRange || hotel.estimatedPrice}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
