import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { FloatingOrbs, StatusPill } from "./TravelUI.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 text-white">
        <FloatingOrbs />
        <div className="premium-card relative z-10 w-full max-w-md p-8 text-center">
          <StatusPill tone="active">Preparing your cockpit</StatusPill>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full w-2/3 animate-shimmer rounded-full bg-gradient-to-r from-cyan-300 via-indigo-300 to-cyan-300" />
          </div>
          <p className="mt-6 text-2xl font-semibold tracking-tight">Loading your travel memory</p>
          <p className="mt-2 text-sm leading-6 text-white/[0.65]">Restoring sessions, profile preferences, and saved plans.</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-white/[0.45]">
            <span className="h-2 w-2 animate-soft-pulse rounded-full bg-cyan-300" />
            Syncing agents
          </div>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}
