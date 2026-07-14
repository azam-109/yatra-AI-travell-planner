import { Link } from "react-router-dom";
import { ArrowRight, Bot, BrainCircuit, Globe2, Sparkles, Stars, WandSparkles } from "lucide-react";
import { FloatingOrbs, QuickChip, StatCard, StatusPill } from "../components/TravelUI.jsx";

const highlights = [
  {
    title: "Agent collaboration",
    text: "Flights, hotels, itinerary, budget, and memory work together in one intelligent flow."
  },
  {
    title: "Live progress",
    text: "Watch planning stages unfold with progressive reveal states instead of static loaders."
  },
  {
    title: "Premium presentation",
    text: "Travel results land as a polished dashboard, not a wall of text."
  }
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <FloatingOrbs />

      <section className="relative hero-grid">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.18),transparent_38%)]" />
        <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-4 py-10 md:px-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8 animate-fade-up">
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill tone="active">Multi-agent AI travel</StatusPill>
              <QuickChip>
                <BrainCircuit size={12} />
                LangGraph orchestration
              </QuickChip>
              <QuickChip>
                <Globe2 size={12} />
                Premium travel planning
              </QuickChip>
            </div>

            <div className="max-w-4xl">
              <h1 className="text-5xl font-semibold tracking-tight text-white md:text-7xl">
                Travel planning that feels alive.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/[0.68] md:text-xl">
                Yatra AI turns a simple trip request into a live agent workflow — flights, stays, itinerary, and budget come together in a premium SaaS experience.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/auth" className="premium-button-primary">
                Start planning <ArrowRight size={16} />
              </Link>
              <Link to="/app/chat" className="premium-button-secondary">
                Open cockpit <Bot size={16} />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Planning mode" value="Live AI" detail="Streaming workflows and staged result reveal." tone="accent" />
              <StatCard label="Trip memory" value="Persistent" detail="Saved journeys and profile preferences." tone="good" />
              <StatCard label="Experience" value="Premium" detail="Glassmorphism, motion, and card-based storytelling." tone="warm" />
            </div>
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: "120ms" }}>
            <div className="premium-card relative overflow-hidden p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_35%)]" />
              <div className="relative">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/[0.45]">Live travel cockpit</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">AI agents collaborating in real time</h2>
                  </div>
                  <StatusPill tone="success">Streaming ready</StatusPill>
                </div>

                <div className="grid gap-3">
                  {[
                    ["Understanding trip requirements", "Traveler goals, budget, and timing are parsed first."],
                    ["Searching flights and hotels", "The planner narrows options with live availability signals."],
                    ["Finalizing itinerary", "Daily plans, insights, and budget are assembled last."]
                  ].map(([title, text], index) => (
                    <div
                      key={title}
                      className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
                      style={{ animationDelay: `${index * 90}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/25 to-indigo-400/20 text-cyan-100">
                          <Stars size={17} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">{title}</p>
                          <p className="mt-1 text-sm leading-6 text-white/[0.62]">{text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Workflow intelligence</p>
                    <p className="mt-2 text-sm leading-6 text-white/[0.72]">
                      Premium cards, progressive disclosure, and a workflow timeline that makes the AI feel present.
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Responsive by design</p>
                    <p className="mt-2 text-sm leading-6 text-white/[0.72]">
                      Mobile-first surfaces, touch-friendly controls, and layouts that adapt cleanly to every screen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-14 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((item, index) => (
            <article
              key={item.title}
              className="premium-card p-6 animate-fade-up"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/25 to-indigo-400/[0.15] text-cyan-100">
                <WandSparkles size={18} />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/[0.65]">{item.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/auth" className="premium-button-secondary">Create your account</Link>
          <Link to="/app/plan" className="premium-button-secondary">Build a premium itinerary</Link>
          <Link to="/app/trips" className="premium-button-secondary">Browse saved journeys</Link>
        </div>
      </section>
    </main>
  );
}
