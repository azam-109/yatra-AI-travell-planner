import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Compass, LayoutDashboard, LogOut, MessageSquare, Plane, PlusCircle, UserRound, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { StatusPill } from "./TravelUI.jsx";

const nav = [
  { to: "/app/plan", label: "Plan Trip", icon: PlusCircle },
  { to: "/app/chat", label: "AI Chat", icon: MessageSquare },
  { to: "/app/trips", label: "Saved Trips", icon: Plane },
  { to: "/app/profile", label: "Profile", icon: UserRound }
];

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition duration-200 ${
          isActive
            ? "bg-white/10 text-white shadow-lg shadow-cyan-500/10"
            : "text-white/70 hover:bg-white/[0.07] hover:text-white"
        }`
      }
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 transition duration-200 group-hover:border-cyan-300/20 group-hover:bg-white/10">
        <Icon size={17} />
      </span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/10 bg-slate-950/[0.55] p-5 backdrop-blur-2xl md:flex md:flex-col">
        <div className="mb-8 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 via-teal-400 to-indigo-400 text-slate-950 shadow-lg shadow-cyan-500/20">
            <Compass size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-tight">Yatra AI</p>
            <p className="truncate text-xs text-white/[0.55]">Agentic travel planning cockpit</p>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/10 to-indigo-400/[0.08] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Live system</p>
              <p className="mt-1 text-sm font-semibold">Multi-agent orchestration</p>
            </div>
            <StatusPill tone="active">Online</StatusPill>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-white/70">
            <Sparkles size={15} className="text-cyan-300" />
            Premium planning, streaming, and trip memory.
          </div>
        </div>

        <nav className="space-y-2">
          {nav.map(({ to, label, icon }) => (
            <NavItem key={to} to={to} label={label} icon={icon} />
          ))}
        </nav>

        <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.18em] text-white/[0.45]">Signed in as</p>
          <p className="mt-1 truncate text-sm font-semibold">{user?.name || user?.email || "Explorer"}</p>
          <p className="mt-1 text-xs text-white/50">{user?.email}</p>
          <button
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/60 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 via-teal-400 to-indigo-400 text-slate-950">
                <Compass size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold">Yatra AI</p>
                <p className="text-xs text-white/[0.55]">Travel cockpit</p>
              </div>
            </div>
            <button
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Sign out
            </button>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 bg-white/5 text-white/70"
                  }`
                }
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
