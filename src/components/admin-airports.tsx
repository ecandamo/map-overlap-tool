"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { AirportReference, SessionState } from "@/lib/types";

const emptyForm: AirportReference = {
  iata: "",
  city: "",
  country: "",
  region: "",
  latitude: 0,
  longitude: 0
};

export function AdminAirports() {
  const [session, setSession] = useState<SessionState>({ authenticated: false });
  const [airports, setAirports] = useState<AirportReference[]>([]);
  const [form, setForm] = useState<AirportReference>(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [email, setEmail] = useState("admin@local.test");
  const [password, setPassword] = useState("changeme123");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  async function loadSession() {
    const response = await fetch("/api/auth/session");
    const data = (await response.json()) as SessionState;
    setSession(data);
  }

  async function loadAirports() {
    const response = await fetch("/api/airports");
    const data = (await response.json()) as { airports: AirportReference[] };
    setAirports(data.airports);
  }

  useEffect(() => {
    void loadSession();
  }, []);

  useEffect(() => {
    if (session.authenticated) {
      void loadAirports();
    }
  }, [session.authenticated]);

  const sortedAirports = useMemo(() => [...airports].sort((a, b) => a.iata.localeCompare(b.iata)), [airports]);
  const filteredAirports = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return sortedAirports;
    }

    return sortedAirports.filter((airport) =>
      [airport.iata, airport.city, airport.country, airport.region].some((value) => value.toLowerCase().includes(query))
    );
  }, [search, sortedAirports]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { message?: string } | null;
      setMessage(error?.message ?? "Invalid admin credentials.");
      return;
    }

    setMessage("Signed in.");
    await loadSession();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession({ authenticated: false });
    setMessage("Signed out.");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const method = editing ? "PUT" : "POST";
    const endpoint = editing ? `/api/airports/${editing}` : "/api/airports";
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        iata: form.iata.toUpperCase()
      })
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { message?: string } | null;
      setMessage(error?.message ?? "Unable to save airport.");
      return;
    }

    setForm(emptyForm);
    setEditing(null);
    setMessage("Airport saved.");
    await loadAirports();
  }

  async function handleDelete(iata: string) {
    const response = await fetch(`/api/airports/${iata}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("Unable to delete airport.");
      return;
    }

    setMessage(`Deleted ${iata}.`);
    await loadAirports();
  }

  async function handleBulkUpload(file: File) {
    const text = await file.text();
    const { parseAirportCsvText } = await import("@/lib/csv");
    const { airports: parsedAirports, issues } = parseAirportCsvText(text);
    if (issues.length > 0) {
      setMessage(issues[0].message);
      return;
    }

    const response = await fetch("/api/airports/bulk-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ airports: parsedAirports })
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { message?: string } | null;
      setMessage(error?.message ?? "Bulk upload failed.");
      return;
    }

    setMessage(`Uploaded ${parsedAirports.length} airports.`);
    await loadAirports();
  }

  if (!session.authenticated) {
    return (
      <section className="mx-auto max-w-xl rounded-[2rem] border border-black/10 bg-white/80 p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Admin login</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">This area is only for managing airport reference data.</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local`, then sign in here.
        </p>
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950" placeholder="Email" />
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950" placeholder="Password" />
          <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">Sign in</button>
        </form>
        {message ? <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-[2rem] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Airport reference admin</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Add single airports, edit existing records, or bulk-upload a master file.</p>
        </div>
        <div className="flex gap-3">
          <a href="/templates/airport-master-template.csv" className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/10">
            Download template
          </a>
          <button onClick={handleLogout} className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/10">
            Sign out
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <form onSubmit={handleSave} className="space-y-4 rounded-[2rem] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{editing ? `Edit ${editing}` : "Add airport"}</h2>
          {(["iata", "city", "country", "region"] as const).map((field) => (
            <input
              key={field}
              value={String(form[field])}
              onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950"
              placeholder={field.toUpperCase()}
            />
          ))}
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="number"
              step="0.0001"
              value={form.latitude}
              onChange={(event) => setForm((current) => ({ ...current, latitude: Number(event.target.value) }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950"
              placeholder="Latitude"
            />
            <input
              type="number"
              step="0.0001"
              value={form.longitude}
              onChange={(event) => setForm((current) => ({ ...current, longitude: Number(event.target.value) }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950"
              placeholder="Longitude"
            />
          </div>
          <div className="flex gap-3">
            <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
              {editing ? "Update airport" : "Add airport"}
            </button>
            {editing ? (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm);
                }}
                className="rounded-full border border-black/10 px-5 py-3 text-sm font-medium dark:border-white/10"
              >
                Cancel
              </button>
            ) : null}
          </div>
          <label className="block rounded-[1.5rem] border border-dashed border-black/10 p-4 text-sm dark:border-white/10">
            Bulk upload airport master CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="mt-3 block"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleBulkUpload(file);
                }
              }}
            />
          </label>
          {message ? <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
        </form>

        <section className="rounded-[2rem] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Airport reference records</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{filteredAirports.length} rows visible</p>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by IATA, city, country, or region"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm md:max-w-sm dark:border-white/10 dark:bg-slate-950"
            />
          </div>
          <div className="mt-4 max-h-[36rem] overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="pb-3">IATA</th>
                  <th className="pb-3">City</th>
                  <th className="pb-3">Country</th>
                  <th className="pb-3">Region</th>
                  <th className="pb-3">Lat</th>
                  <th className="pb-3">Lng</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAirports.map((airport) => (
                  <tr key={airport.iata} className="border-t border-black/5 dark:border-white/10">
                    <td className="py-3 font-semibold">{airport.iata}</td>
                    <td className="py-3">{airport.city}</td>
                    <td className="py-3">{airport.country}</td>
                    <td className="py-3">{airport.region}</td>
                    <td className="py-3">{airport.latitude}</td>
                    <td className="py-3">{airport.longitude}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditing(airport.iata);
                            setForm(airport);
                          }}
                          className="rounded-full border border-black/10 px-3 py-1 dark:border-white/10"
                        >
                          Edit
                        </button>
                        <button onClick={() => void handleDelete(airport.iata)} className="rounded-full border border-black/10 px-3 py-1 dark:border-white/10">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAirports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-slate-500 dark:text-slate-400">
                      No airports match the current search.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>
  );
}
