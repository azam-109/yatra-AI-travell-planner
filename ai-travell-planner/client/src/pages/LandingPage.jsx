import { Link } from "react-router-dom";
import { ArrowRight, Bot, BrainCircuit, Plane } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="relative min-h-[92vh] overflow-hidden bg-ink text-white">
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80"
          alt="Travel landscape"
        />
        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-6 py-12">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur">
              <BrainCircuit size={16} /> LangGraph multi-agent travel planning
            </p>
            <h1 className="text-5xl font-black leading-tight md:text-7xl">Yatra AI Travel Planner</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/88">
              Plan flights, hotels, food, sightseeing, transport, budgets, and personal preferences through collaborating AI agents powered by Groq Llama 3.3 70B.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" className="inline-flex items-center gap-2 rounded bg-coral px-5 py-3 font-bold text-white">
                Start planning <ArrowRight size={18} />
              </Link>
              <Link to="/app/chat" className="inline-flex items-center gap-2 rounded bg-white px-5 py-3 font-bold text-ink">
                Open chat <Bot size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto -mt-12 grid max-w-6xl gap-4 px-6 pb-16 md:grid-cols-3">
        {["Flight Agent", "Hotel Agent", "Itinerary Agent"].map((label) => (
          <article key={label} className="relative rounded border border-slate-200 bg-white p-5 shadow-soft">
            <Plane className="mb-4 text-reef" size={24} />
            <h2 className="font-black">{label}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Specialized planning logic coordinated by a LangGraph workflow.</p>
          </article>
        ))}
      </section>
    </main>
  );
}
