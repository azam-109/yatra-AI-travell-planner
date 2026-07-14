import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, MapPinned, Sparkles, WandSparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { FloatingOrbs, QuickChip, StatCard, StatusPill } from "../components/TravelUI.jsx";

const benefits = [
  "Trip memory and saved plans",
  "Premium multi-agent planning experience",
  "Fast access to live itinerary updates"
];

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") await login({ email: form.email, password: form.password });
      else await register(form);
      navigate("/app/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-white md:px-8 md:py-8">
      <FloatingOrbs />

      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-stretch gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="premium-card relative overflow-hidden p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_32%)]" />
          <div className="relative">
            <StatusPill tone="active">{mode === "login" ? "Welcome back" : "Create an account"}</StatusPill>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
              Plan every trip like a premium AI product.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/[0.68]">
              Save preferences, retrieve travel memory, and turn each request into a live, agent-driven planning session.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <StatCard label="Agents" value="8+" detail="Flight, hotel, itinerary, and budget collaboration." tone="accent" />
              <StatCard label="Experience" value="Realtime" detail="Streaming responses and progressive reveal." tone="good" />
            </div>

            <div className="mt-8 space-y-3">
              {benefits.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/[0.78]">
                  <CheckCircle2 size={16} className="text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <QuickChip>
                <MapPinned size={12} />
                Trip memory
              </QuickChip>
              <QuickChip>
                <Sparkles size={12} />
                Motion-rich UI
              </QuickChip>
              <QuickChip>
                <WandSparkles size={12} />
                Intelligent workflow
              </QuickChip>
            </div>
          </div>
        </section>

        <section className="premium-card relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.14),transparent_30%)]" />
          <form onSubmit={submit} className="relative grid gap-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/[0.45]">Secure access</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  {mode === "login" ? "Sign in" : "Create your account"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/[0.62]">Step into the travel cockpit and continue planning.</p>
              </div>
              <StatusPill tone="success">Protected</StatusPill>
            </div>

            {mode === "register" && (
              <label>
                <span className="premium-label">Name</span>
                <input
                  className="premium-input"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </label>
            )}

            <label>
              <span className="premium-label">Email</span>
              <input
                className="premium-input"
                placeholder="name@company.com"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </label>

            <label>
              <span className="premium-label">Password</span>
              <input
                className="premium-input"
                placeholder="••••••••"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </label>

            {error && <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</p>}

            <button disabled={loading} className="premium-button-primary mt-2 w-full disabled:opacity-60">
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Register"}
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="premium-button-secondary w-full"
            >
              {mode === "login" ? "Need an account?" : "Already registered?"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
