import { BedDouble, Globe2, Hotel, MapPin, Star, Sparkles } from "lucide-react";
import { SectionCard, StatusPill, formatCurrency, asList, classNames } from "./TravelUI.jsx";

const HOTEL_BACKDROPS = [
  "from-cyan-500/25 via-indigo-500/[0.15] to-white/5",
  "from-emerald-500/20 via-teal-500/10 to-white/5",
  "from-amber-500/20 via-rose-500/10 to-white/5"
];

function HotelCard({ hotel, index }) {
  const amenities = asList(hotel.amenities).slice(0, 4);
  const backdrop = HOTEL_BACKDROPS[index % HOTEL_BACKDROPS.length];
  const topPick = index === 0;

  return (
    <article className="group overflow-hidden rounded-[26px] border border-white/10 bg-white/5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/20 hover:bg-white/10">
      <div className={classNames("relative h-40 overflow-hidden bg-gradient-to-br", backdrop)}>
        <div className="absolute inset-0 hero-grid opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_35%)]" />
        <div className="absolute left-4 top-4">
          <StatusPill tone={topPick ? "success" : "neutral"}>{topPick ? "Best stay" : "Curated"}</StatusPill>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">Premium stay</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-white">{hotel.name || "Curated hotel"}</p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white">
            <BedDouble size={18} />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-sm text-white/[0.65]">
              <MapPin size={14} className="text-cyan-300" />
              {hotel.location || "Prime location"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Star size={14} className="text-amber-300" />
              <span className="text-sm font-semibold text-white/[0.85]">{hotel.rating || "High guest rating"}</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">From</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-cyan-100">
              {formatCurrency(hotel.priceRange || hotel.estimatedPrice, hotel.priceRange || hotel.estimatedPrice || "Live pricing")}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-white/70">{hotel.reason || "Hand-picked for convenience, comfort, and proximity."}</p>

        {amenities.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {amenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/70"
              >
                <Sparkles size={11} className="mr-1 text-cyan-300" />
                {amenity}
              </span>
            ))}
          </div>
        ) : null}

        {hotel.url ? (
          <a
            href={hotel.url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition hover:text-white"
          >
            Open listing
            <Globe2 size={14} />
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default function HotelCards({ hotels }) {
  const options = hotels?.options || [];
  if (!options.length) return null;

  return (
    <SectionCard
      eyebrow="Hotels"
      title="Where to stay"
      description={hotels?.hotelSummary || "Premium stay options curated from the hotel agent."}
      icon={Hotel}
      action={<StatusPill tone="active">{options.length} stays</StatusPill>}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {options.slice(0, 6).map((hotel, index) => (
          <HotelCard key={`${hotel.name || "hotel"}-${index}`} hotel={hotel} index={index} />
        ))}
      </div>
      {hotels?.estimatedTotal ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          <span className="font-medium">Live rates:</span> {hotels.estimatedTotal}
        </div>
      ) : null}
    </SectionCard>
  );
}
