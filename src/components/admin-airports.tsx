"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/field";
import { SectionHeader } from "@/components/ui/section-header";
import { Surface } from "@/components/ui/surface";
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
      <Surface as="section" variant="panelStrong" className="mx-auto max-w-xl rounded-[2rem] p-8 shadow-sm">
        <BrandLogo className="w-[140px]" priority="compact" />
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">This area is only for managing airport reference data.</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local`, then sign in here.
        </p>
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <InputField value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl px-4 py-3 text-sm" placeholder="Email" />
          <InputField type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-2xl px-4 py-3 text-sm" placeholder="Password" />
          <Button type="submit" className="px-5 py-3">Sign In</Button>
        </form>
        {message ? <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
      </Surface>
    );
  }

  return (
    <div className="space-y-8">
      <Surface as="section" variant="panelStrong" className="flex flex-col gap-4 rounded-[2rem] p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <BrandLogo className="mb-4 w-[144px]" priority="compact" />
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Airport Reference Admin</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Add single airports, edit existing records, or bulk-upload a master file.</p>
        </div>
        <div className="flex gap-3">
          <a href="/templates/airport-master-template.csv" className="brand-btn-secondary inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium">
            Download Template
          </a>
          <Button onClick={handleLogout} variant="secondary" size="sm">
            Sign Out
          </Button>
        </div>
      </Surface>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Surface as="form" variant="panel" onSubmit={handleSave} className="space-y-4 rounded-[2rem] p-6">
          <SectionHeader title={editing ? `Edit ${editing}` : "Add Airport"} />
          {(["iata", "city", "country", "region"] as const).map((field) => (
            <InputField
              key={field}
              value={String(form[field])}
              onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
              className="rounded-2xl px-4 py-3 text-sm"
              placeholder={field.toUpperCase()}
            />
          ))}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-100">Latitude</span>
              <InputField
                type="number"
                step="0.0001"
                value={form.latitude}
                onChange={(event) => setForm((current) => ({ ...current, latitude: Number(event.target.value) }))}
                className="rounded-2xl px-4 py-3 text-sm"
                placeholder="Latitude"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-100">Longitude</span>
              <InputField
                type="number"
                step="0.0001"
                value={form.longitude}
                onChange={(event) => setForm((current) => ({ ...current, longitude: Number(event.target.value) }))}
                className="rounded-2xl px-4 py-3 text-sm"
                placeholder="Longitude"
              />
            </label>
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="px-5 py-3">
              {editing ? "Update Airport" : "Add Airport"}
            </Button>
            {editing ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm);
                }}
                variant="secondary"
                className="px-5 py-3"
              >
                Cancel
              </Button>
            ) : null}
          </div>
          <label className="block rounded-[1.5rem] border border-dashed border-[var(--panel-border)] bg-[color-mix(in_srgb,var(--panel-strong)_80%,transparent)] p-4 text-sm">
            Bulk Upload Airport Master CSV
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
        </Surface>

        <Surface as="section" variant="panel" className="rounded-[2rem] p-6">
          <SectionHeader
            title="Airport Reference Records"
            description={`${filteredAirports.length} Rows Visible`}
            className="flex-col gap-4 md:flex-row md:items-center"
            meta={
              <InputField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by IATA, City, Country, or Region"
              className="rounded-2xl px-4 py-3 text-sm md:min-w-[20rem]"
              />
            }
          />
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
                        <Button
                          onClick={() => {
                            setEditing(airport.iata);
                            setForm(airport);
                          }}
                          variant="secondary"
                          size="sm"
                          className="border-black/10 px-3 py-1 dark:border-white/10"
                        >
                          Edit
                        </Button>
                        <Button onClick={() => void handleDelete(airport.iata)} variant="secondary" size="sm" className="border-black/10 px-3 py-1 dark:border-white/10">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAirports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-slate-500 dark:text-slate-400">
                      No Airports Match the Current Search.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Surface>
      </section>
    </div>
  );
}
