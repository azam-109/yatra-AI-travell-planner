import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Compass, LogOut, MessageSquare, Plane, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const nav = [
  { to: "/app/chat", label: "AI Chat", icon: MessageSquare },
  { to: "/app/trips", label: "Saved Trips", icon: Plane },
  { to: "/app/profile", label: "Profile", icon: UserRound }
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-mist">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 md:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded bg-reef text-white">
            <Compass size={22} />
          </div>
          <div>
            <p className="text-lg font-black">Yatra AI</p>
            <p className="text-xs text-slate-500">Multi-agent planner</p>
          </div>
        </div>
        <nav className="space-y-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded px-3 py-2 text-sm font-semibold ${
                  isActive ? "bg-reef text-white" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5">
          <p className="mb-3 truncate text-sm font-semibold">{user?.name}</p>
          <button
            className="flex w-full items-center gap-2 rounded border border-slate-200 px-3 py-2 text-sm font-semibold"
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
      <main className="md:pl-64">
        <div className="mx-auto max-w-7xl p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
