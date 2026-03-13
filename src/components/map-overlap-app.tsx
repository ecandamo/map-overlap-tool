"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { ColorPicker } from "@/components/color-picker";
import { DataTable } from "@/components/data-table";
import { FileDropzone } from "@/components/file-dropzone";
import { SummaryCard } from "@/components/summary-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { TopOverlapList } from "@/components/top-overlap-list";
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

function buildValidationSummary(result?: ParsedCsvResult) {
  if (!result) {
    return {
      statusLabel: "No file",
      statusTone: "neutral" as const,
      summary: "Upload a CSV to check for issues and unknown IATA codes."
    };
  }

  const issueCount = result.issues.length;
  const unknownCount = result.unknownIatas.length;
  const hasWarnings = issueCount > 0 || unknownCount > 0;
  const summaryParts = [
    issueCount > 0 ? `${issueCount} issue${issueCount === 1 ? "" : "s"}` : null,
    unknownCount > 0 ? `${unknownCount} unknown IATA${unknownCount === 1 ? "" : "s"}` : null
  ].filter(Boolean);

  return {
    statusLabel: hasWarnings ? "Review" : "OK",
    statusTone: hasWarnings ? ("warning" as const) : ("good" as const),
    summary: hasWarnings ? summaryParts.join(", ") : `${result.matchedIatas.length} matches, no issues found.`,
    details: [
      `${result.fileName} loaded with ${result.normalizedRows.length} unique airports.`,
      issueCount > 0 ? `Issues: ${result.issues.map((issue) => `Row ${issue.rowNumber}: ${issue.message}`).join(" | ")}` : null,
      unknownCount > 0 ? `Unknown IATA codes: ${result.unknownIatas.join(", ")}` : null
    ].filter((detail): detail is string => Boolean(detail))
  };
}

export function MapOverlapApp() {
  const region = useAppStore((state) => state.region);
  const setRegion = useAppStore((state) => state.setRegion);
  const clientName = useAppStore((state) => state.clientName);
  const setClientName = useAppStore((state) => state.setClientName);
  const volumeUnits = useAppStore((state) => state.volumeUnits);
  const setVolumeUnits = useAppStore((state) => state.setVolumeUnits);
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
  const [controlsExpanded, setControlsExpanded] = useState(true);
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
  const clientDisplayName = useMemo(() => clientName.trim() || "Client", [clientName]);
  const volumeUnitsLabel = useMemo(() => volumeUnits.trim() || "Volume", [volumeUnits]);
  const clientOnlyLabel = `${clientDisplayName}-Only`;
  const categorizedRows = useMemo(
    () => ({
      apiOnly: filteredPoints.filter((point) => point.category === "api-only"),
      clientOnly: filteredPoints.filter((point) => point.category === "client-only"),
      overlap: filteredPoints.filter((point) => point.category === "overlap")
    }),
    [filteredPoints]
  );

  const apiValidation = useMemo(() => buildValidationSummary(apiResult), [apiResult]);
  const clientValidation = useMemo(() => buildValidationSummary(clientResult), [clientResult]);

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
                Upload API and {clientDisplayName} CSVs, validate them, resolve airports from the built-in reference database, and explore overlap by region.
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
              {`The app will validate uploads, combine duplicates, flag unknown IATA codes, and render API-only, ${clientOnlyLabel.toLowerCase()}, and overlap destinations together.`}
            </p>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <FileDropzone
            label="API Hotel Contracts"
            description="Expected columns: IATA, city, country, region, volume. Duplicate airport rows are summed during normalization."
            onFileSelect={(file) => void handleFile(file, "api")}
            validation={apiValidation}
            templateLabel="API Upload Template"
            onTemplateDownload={() =>
              downloadTextFile("api-template.csv", "IATA,city,country,region,volume\nLHR,London,United Kingdom,Europe,320\nJFK,New York,United States,North America,220\n")
            }
          />
          <FileDropzone
            label={`${clientDisplayName} Layovers`}
            description={`Upload the ${clientDisplayName} layover destination file. Unknown IATA codes stay visible in validation but are excluded from the map.`}
            onFileSelect={(file) => void handleFile(file, "client")}
            validation={clientValidation}
            templateLabel={`${clientDisplayName} Upload Template`}
            onTemplateDownload={() =>
              downloadTextFile("client-template.csv", "IATA,city,country,region,volume\nSIN,Singapore,Singapore,Asia Pacific,150\nLHR,London,United Kingdom,Europe,290\n")
            }
          />
        </section>

        <section>
          <div className="rounded-[2rem] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Controls</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Adjust the active client label, focus the map by region, and fine-tune how each category appears.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setControlsExpanded((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                aria-expanded={controlsExpanded}
                aria-controls="controls-panel"
              >
                <span>{controlsExpanded ? "Collapse" : "Expand"}</span>
                <span className={`text-xs transition ${controlsExpanded ? "rotate-180" : ""}`}>⌃</span>
              </button>
            </div>
            {controlsExpanded ? (
              <div id="controls-panel" className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
                <div className="rounded-[1.75rem] border border-black/10 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Data View</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Set the client label, define the volume units used in the comparison, and narrow the map to a specific region.</p>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium">Client Name</span>
                      <input
                        value={clientName}
                        onChange={(event) => setClientName(event.target.value)}
                        placeholder="Enter Client Name"
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950"
                      />
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Used in section titles, map labels, and summary cards.</p>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium">Volume Units</span>
                      <input
                        value={volumeUnits}
                        onChange={(event) => setVolumeUnits(event.target.value)}
                        placeholder="Rooms, contracts, nights..."
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950"
                      />
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Defines what the uploaded volume values represent across the comparison.</p>
                    </label>
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
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Showing {formatNumber(filteredPoints.length)} mapped destinations in {region === REGION_ALL ? "all regions" : region}.
                      </p>
                    </label>
                  </div>
                </div>
                <div className="rounded-[1.75rem] border border-black/10 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Appearance</p>
                  <div className="mt-1 flex items-center justify-between gap-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Choose the marker colors used for each destination category.</p>
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Map Colors</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <ColorPicker label="API-Only" value={colors.apiOnly} onChange={(value) => setColor("apiOnly", value)} />
                    <ColorPicker label={clientOnlyLabel} value={colors.clientOnly} onChange={(value) => setColor("clientOnly", value)} />
                    <ColorPicker label="Overlap" value={colors.overlap} onChange={(value) => setColor("overlap", value)} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_0.95fr]">
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard label="API Destinations" value={formatNumber(summary.apiDestinations)} accent={colors.apiOnly} eyebrow="Mapped" valueSize="large" />
            <SummaryCard label={`${clientDisplayName} Destinations`} value={formatNumber(summary.clientDestinations)} accent={colors.clientOnly} eyebrow="Mapped" valueSize="large" />
            <SummaryCard label="Overlap Destinations" value={formatNumber(summary.overlapDestinations)} accent={colors.overlap} eyebrow="Shared" valueSize="large" />
          </div>
          <SummaryCard
            label=""
            value={formatPercent(summary.overlapPercent)}
            eyebrow="Coverage"
            variant="feature"
            hideValue
            detail={
              summary.clientDestinations > 0 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] sm:items-stretch">
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Current Overlap %</p>
                      <p className="mt-2 text-5xl font-semibold text-slate-950 dark:text-white">{formatPercent(summary.overlapPercent)}</p>
                    </div>
                    <div className="hidden w-px bg-black/10 sm:block dark:bg-white/10" aria-hidden="true" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Potential Overlap %</p>
                        <div className="group/tooltip relative">
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500 dark:border-slate-600 dark:text-slate-400">
                            i
                          </span>
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-2xl border border-black/10 bg-white/95 p-3 text-xs normal-case tracking-normal text-slate-600 shadow-lg shadow-slate-300/30 backdrop-blur group-hover/tooltip:block dark:border-white/10 dark:bg-slate-950/95 dark:text-slate-300 dark:shadow-none">
                            Potential overlap estimates additional client-only destinations that API may cover based on nearby city, country or region presence.
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-5xl font-semibold text-slate-950 dark:text-white">{formatPercent(summary.potentialOverlapPercent)}</p>
                    </div>
                  </div>
                </>
              ) : (
                "Upload data to see current and potential overlap coverage."
              )
            }
          />
        </section>

        <section>
          <OverlapMap points={filteredPoints} region={region} clientLabel={clientDisplayName} colors={colors} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.35fr]">
          <TopOverlapList rows={summary.topOverlapAirports} clientLabel={clientDisplayName} />
          <DataTable
            title="Overlap Destinations"
            rows={categorizedRows.overlap}
            volumeColumns="both"
            clientLabel={clientDisplayName}
            volumeUnitsLabel={volumeUnitsLabel}
            variant="feature"
            maxBodyHeightClassName="max-h-[32rem] overflow-y-auto"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <DataTable title="API-Only Destinations" rows={categorizedRows.apiOnly} volumeColumns="api" volumeUnitsLabel={volumeUnitsLabel} maxBodyHeightClassName="max-h-[26rem] overflow-y-auto" />
          <DataTable
            title={`${clientOnlyLabel} Destinations`}
            rows={categorizedRows.clientOnly}
            volumeColumns="client"
            clientLabel={clientDisplayName}
            volumeUnitsLabel={volumeUnitsLabel}
            maxBodyHeightClassName="max-h-[26rem] overflow-y-auto"
          />
        </section>
      </div>
    </main>
  );
}
