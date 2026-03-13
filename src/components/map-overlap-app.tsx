"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { ColorPicker } from "@/components/color-picker";
import { DataTable } from "@/components/data-table";
import { FileDropzone } from "@/components/file-dropzone";
import { SummaryCard } from "@/components/summary-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { TopOverlapList } from "@/components/top-overlap-list";
import { ValidationPanel } from "@/components/validation-panel";
import { REGION_ALL } from "@/lib/constants";
import { computeSummary, filterPointsByRegion, getRegions } from "@/lib/metrics";
import { buildAirportMap, combineDatasets } from "@/lib/normalize";
import { useAppStore } from "@/lib/store";
import { AirportReference, ParsedCsvResult } from "@/lib/types";
import { downloadTextFile, formatNumber, formatPercent } from "@/lib/utils";

async function fetchCsv(url: string) {
  const response = await fetch(url);
  return response.text();
}

const OverlapMap = dynamic(
  () => import("@/components/overlap-map").then((module) => module.OverlapMap),
  {
    loading: () => (
      <section className="rounded-[2rem] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex min-h-[28rem] items-center justify-center rounded-[1.5rem] border border-dashed border-black/10 bg-white/40 text-center dark:border-white/10 dark:bg-white/5">
          <div className="max-w-md px-6">
            <h4 className="text-xl font-semibold text-slate-950 dark:text-white">Loading Map</h4>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Preparing the World Map and Marker Layers.</p>
          </div>
        </div>
      </section>
    ),
    ssr: false
  }
);

async function parseCsv(args: {
  source: "api" | "client";
  text: string;
  fileName: string;
  airportMap: Map<string, AirportReference>;
}) {
  const { parseCsvText } = await import("@/lib/csv");
  return parseCsvText(args);
}

export function MapOverlapApp() {
  const region = useAppStore((state) => state.region);
  const setRegion = useAppStore((state) => state.setRegion);
  const colors = useAppStore((state) => state.colors);
  const setColor = useAppStore((state) => state.setColor);
  const theme = useAppStore((state) => state.theme);
  const setResults = useAppStore((state) => state.setResults);
  const apiResult = useAppStore((state) => state.apiResult);
  const clientResult = useAppStore((state) => state.clientResult);
  const points = useAppStore((state) => state.points);
  const airportsLoaded = useAppStore((state) => state.airportsLoaded);
  const setAirportsLoaded = useAppStore((state) => state.setAirportsLoaded);

  const [airportMap, setAirportMap] = useState<Map<string, AirportReference>>(new Map());
  const [loading, setLoading] = useState(false);
  const airportLoadAttempted = useRef(false);
  const apiSourceRef = useRef<{ text: string; fileName: string } | null>(null);
  const clientSourceRef = useRef<{ text: string; fileName: string } | null>(null);

  useEffect(() => {
    async function loadAirports() {
      const response = await fetch("/api/airports");
      const data = (await response.json()) as { airports: AirportReference[] };
      setAirportMap(buildAirportMap(data.airports));
      setAirportsLoaded(true);
      airportLoadAttempted.current = true;
    }

    void loadAirports();
  }, [setAirportsLoaded]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("map-overlap-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      useAppStore.getState().setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("map-overlap-theme", theme);
  }, [theme]);

  const filteredPoints = useMemo(() => filterPointsByRegion(points, region), [points, region]);
  const summary = useMemo(() => computeSummary(filteredPoints), [filteredPoints]);
  const regions = useMemo(() => getRegions(points), [points]);
  const categorizedRows = useMemo(
    () => ({
      apiOnly: filteredPoints.filter((point) => point.category === "api-only"),
      clientOnly: filteredPoints.filter((point) => point.category === "client-only"),
      overlap: filteredPoints.filter((point) => point.category === "overlap")
    }),
    [filteredPoints]
  );

  function buildCombinedResults(nextApi?: ParsedCsvResult, nextClient?: ParsedCsvResult) {
    const apiUnknownIatas = nextApi ? new Set(nextApi.unknownIatas) : new Set<string>();
    const clientUnknownIatas = nextClient ? new Set(nextClient.unknownIatas) : new Set<string>();

    return {
      apiResult: nextApi,
      clientResult: nextClient,
      points:
        nextApi && nextClient
          ? combineDatasets({
              apiRows: nextApi.normalizedRows.filter((row) => !apiUnknownIatas.has(row.iata)),
              clientRows: nextClient.normalizedRows.filter((row) => !clientUnknownIatas.has(row.iata)),
              airportMap
            })
          : []
    };
  }

  useEffect(() => {
    if (!airportLoadAttempted.current || airportMap.size === 0) {
      return;
    }

    if (!apiSourceRef.current && !clientSourceRef.current) {
      return;
    }

    async function syncParsedResults() {
      const nextApi = apiSourceRef.current
        ? await parseCsv({
            source: "api",
            text: apiSourceRef.current.text,
            fileName: apiSourceRef.current.fileName,
            airportMap
          })
        : undefined;
      const nextClient = clientSourceRef.current
        ? await parseCsv({
            source: "client",
            text: clientSourceRef.current.text,
            fileName: clientSourceRef.current.fileName,
            airportMap
          })
        : undefined;

      setResults(buildCombinedResults(nextApi, nextClient));
    }

    void syncParsedResults();
  }, [airportMap, setResults]);

  function syncResults(next: { api?: ParsedCsvResult; client?: ParsedCsvResult }) {
    const resolvedApi = next.api ?? apiResult;
    const resolvedClient = next.client ?? clientResult;
    setResults(buildCombinedResults(resolvedApi, resolvedClient));
  }

  async function handleFile(file: File, source: "api" | "client") {
    setLoading(true);
    const text = await file.text();
    const result = await parseCsv({
      source,
      text,
      fileName: file.name,
      airportMap
    });
    if (source === "api") {
      apiSourceRef.current = { text, fileName: file.name };
    } else {
      clientSourceRef.current = { text, fileName: file.name };
    }
    syncResults(source === "api" ? { api: result } : { client: result });
    setLoading(false);
  }

  async function handleLoadDemo() {
    setLoading(true);
    const [apiCsv, clientCsv] = await Promise.all([fetchCsv("/demo/api-demo.csv"), fetchCsv("/demo/client-demo.csv")]);
    apiSourceRef.current = { text: apiCsv, fileName: "api-demo.csv" };
    clientSourceRef.current = { text: clientCsv, fileName: "client-demo.csv" };
    const [nextApi, nextClient] = await Promise.all([
      parseCsv({ source: "api", text: apiCsv, fileName: "api-demo.csv", airportMap }),
      parseCsv({ source: "client", text: clientCsv, fileName: "client-demo.csv", airportMap })
    ]);
    setResults(buildCombinedResults(nextApi, nextClient));
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_45%,#fff7ed_100%)] px-4 py-8 text-slate-900 transition dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_45%,#1e293b_100%)] dark:text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-black/10 bg-white/75 p-8 shadow-xl shadow-slate-300/30 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-none">
          <div className="absolute right-6 top-6 z-10">
            <ThemeToggle />
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700 dark:text-sky-300">API GLOBAL SOLUTIONS</p>
              <h1 className="mt-3 pr-24 text-4xl font-semibold leading-tight text-slate-950 dark:text-white md:text-6xl">
                Layover Destinations Overlap Map
              </h1>
              <p className="mt-4 text-base text-slate-600 dark:text-slate-300 md:text-lg">
                Upload API and client CSVs, validate them, resolve airports from the built-in reference database, and explore overlap by region.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/admin" className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/10">
                Admin Login
              </a>
              <button onClick={handleLoadDemo} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                Load Demo Data
              </button>
            </div>
          </div>
        </section>

        {!apiResult || !clientResult ? (
          <section className="rounded-[2rem] border border-dashed border-black/10 bg-white/60 p-10 text-center dark:border-white/10 dark:bg-white/5">
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Start with Two CSVs or Load the Demo</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              The app will validate uploads, combine duplicates, flag unknown IATA codes, and render API-only, client-only, and overlap destinations together.
            </p>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <FileDropzone
            label="API Hotel Contracts"
            description="Expected columns: IATA, city, country, region, volume. Duplicate airport rows are summed during normalization."
            onFileSelect={(file) => void handleFile(file, "api")}
            statusText={apiResult ? `${apiResult.fileName} Loaded with ${apiResult.normalizedRows.length} Unique Airports.` : undefined}
            templateLabel="API Template"
            onTemplateDownload={() =>
              downloadTextFile("api-template.csv", "IATA,city,country,region,volume\nLHR,London,United Kingdom,Europe,320\nJFK,New York,United States,North America,220\n")
            }
          />
          <FileDropzone
            label="Prospect Client Layovers"
            description="Upload the client layover destination file. Unknown IATA codes stay visible in validation but are excluded from the map."
            onFileSelect={(file) => void handleFile(file, "client")}
            statusText={clientResult ? `${clientResult.fileName} Loaded with ${clientResult.normalizedRows.length} Unique Airports.` : undefined}
            templateLabel="Client Template"
            onTemplateDownload={() =>
              downloadTextFile("client-template.csv", "IATA,city,country,region,volume\nSIN,Singapore,Singapore,Asia Pacific,150\nLHR,London,United Kingdom,Europe,290\n")
            }
          />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.75rem] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Airport Reference Records</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{formatNumber(airportMap.size)}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Built-in airport master rows available for IATA-to-coordinate matching.</p>
          </div>
          <div className="rounded-[1.75rem] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">API Rows Matched</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{formatNumber(apiResult?.matchedIatas.length ?? 0)}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Unique API IATA codes currently resolvable from the airport reference set.</p>
          </div>
          <div className="rounded-[1.75rem] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Client Rows Matched</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{formatNumber(clientResult?.matchedIatas.length ?? 0)}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Unique client IATA codes currently resolvable from the airport reference set.</p>
          </div>
        </section>

        <section>
          <div className="rounded-[2rem] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Controls</h3>
              <span className="text-sm text-slate-500 dark:text-slate-400">{loading || !airportsLoaded ? "Loading..." : "Ready"}</span>
            </div>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Region Filter</span>
                <select
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950"
                >
                  <option>{REGION_ALL}</option>
                  {regions.map((regionValue) => (
                    <option key={regionValue}>{regionValue}</option>
                  ))}
                </select>
              </label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {formatNumber(filteredPoints.length)} mapped destinations in {region === REGION_ALL ? "all regions" : region}.
              </p>
              <div className="flex flex-wrap gap-3">
                <ColorPicker label="API-Only" value={colors.apiOnly} onChange={(value) => setColor("apiOnly", value)} />
                <ColorPicker label="Client-Only" value={colors.clientOnly} onChange={(value) => setColor("clientOnly", value)} />
                <ColorPicker label="Overlap" value={colors.overlap} onChange={(value) => setColor("overlap", value)} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="API Destinations" value={formatNumber(summary.apiDestinations)} accent={colors.apiOnly} />
          <SummaryCard label="Client Destinations" value={formatNumber(summary.clientDestinations)} accent={colors.clientOnly} />
          <SummaryCard label="Overlap Destinations" value={formatNumber(summary.overlapDestinations)} accent={colors.overlap} />
          <SummaryCard
            label="Overlap %"
            value={formatPercent(summary.overlapPercent)}
            detail={summary.topOverlapAirports.length > 0 ? `Top Overlaps: ${summary.topOverlapAirports.map((point) => point.iata).join(", ")}` : "Upload Data to See Top Overlapping Airports."}
          />
        </section>

        <section>
          <OverlapMap points={filteredPoints} region={region} colors={colors} />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <ValidationPanel result={apiResult} title="API Validation" />
          <ValidationPanel result={clientResult} title="Client Validation" />
        </section>

        <TopOverlapList rows={summary.topOverlapAirports} />

        <section className="grid gap-6 xl:grid-cols-[0.95fr_0.95fr_1.3fr]">
          <DataTable title="API-Only Destinations" rows={categorizedRows.apiOnly} volumeColumns="api" />
          <DataTable title="Client-Only Destinations" rows={categorizedRows.clientOnly} volumeColumns="client" />
          <DataTable title="Overlap Destinations" rows={categorizedRows.overlap} volumeColumns="both" />
        </section>
      </div>
    </main>
  );
}
