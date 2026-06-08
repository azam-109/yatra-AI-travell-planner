import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

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
    <main className="grid min-h-screen place-items-center bg-mist p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-black">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-2 text-sm text-slate-600">Save preferences, retrieve trip memory, and stream new plans.</p>
        {mode === "register" && (
          <input
            className="mt-6 w-full rounded border border-slate-300 px-3 py-3"
            placeholder="Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        )}
        <input
          className="mt-3 w-full rounded border border-slate-300 px-3 py-3"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <input
          className="mt-3 w-full rounded border border-slate-300 px-3 py-3"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        {error && <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="mt-5 w-full rounded bg-reef px-4 py-3 font-bold text-white disabled:opacity-60">
          {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Register"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-4 w-full text-sm font-semibold text-reef"
        >
          {mode === "login" ? "Need an account?" : "Already registered?"}
        </button>
      </form>
    </main>
  );
}
