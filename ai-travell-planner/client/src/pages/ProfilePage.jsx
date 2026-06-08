import { useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    travelStyle: user?.preferences?.travelStyle || "balanced",
    hotelPreference: user?.preferences?.hotelPreference || "comfortable mid-range",
    foodPreference: user?.preferences?.foodPreference || "local cuisine",
    pace: user?.preferences?.pace || "moderate"
  });
  const [status, setStatus] = useState("");

  async function submit(event) {
    event.preventDefault();
    const { data } = await api.put("/profile", {
      name: form.name,
      preferences: {
        travelStyle: form.travelStyle,
        hotelPreference: form.hotelPreference,
        foodPreference: form.foodPreference,
        pace: form.pace
      }
    });
    setUser(data.user);
    setStatus("Profile saved");
  }

  return (
    <section className="max-w-2xl">
      <h1 className="text-2xl font-black">Profile</h1>
      <p className="mt-2 text-sm text-slate-600">These preferences are included in future RAG-personalized planning.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded border border-slate-200 bg-white p-5">
        {[
          ["name", "Name"],
          ["travelStyle", "Travel style"],
          ["hotelPreference", "Hotel preference"],
          ["foodPreference", "Food preference"],
          ["pace", "Pace"]
        ].map(([key, label]) => (
          <label key={key} className="block text-sm font-bold">
            {label}
            <input
              className="mt-2 w-full rounded border border-slate-300 px-3 py-3 font-normal"
              value={form[key]}
              onChange={(event) => setForm({ ...form, [key]: event.target.value })}
            />
          </label>
        ))}
        <button className="rounded bg-reef px-5 py-3 font-bold text-white">Save preferences</button>
        {status && <p className="text-sm font-semibold text-reef">{status}</p>}
      </form>
    </section>
  );
}
