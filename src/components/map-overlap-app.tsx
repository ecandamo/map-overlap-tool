"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { ColorPicker } from "@/components/color-picker";
import { BrandLogo } from "@/components/brand-logo";
import { CollapsiblePanel } from "@/components/collapsible-panel";
import { DataTable } from "@/components/data-table";
import { FileDropzone } from "@/components/file-dropzone";
import { SummaryCard } from "@/components/summary-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { InputField, SelectField } from "@/components/ui/field";
import { InfoCard } from "@/components/ui/info-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Surface } from "@/components/ui/surface";
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
      <Surface as="section" variant="panel" className="rounded-4xl p-5">
        <div className="flex min-h-112 items-center justify-center rounded-3xl border border-dashed border-black/10 bg-white/40 text-center dark:border-white/10 dark:bg-white/5">
          <div className="max-w-md px-6">
            <h4 className="text-xl font-semibold text-slate-950 dark:text-white">Loading Map</h4>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Preparing the World Map and Marker Layers.</p>
          </div>
        </div>
      </Surface>
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
    summary: hasWarnings ? summaryParts.join(", ") : `${result.matchedIatas.length} matches, no issues found.`
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
  const resetAppState = useAppStore((state) => state.reset);

  const [airportMap, setAirportMap] = useState<Map<string, AirportReference>>(new Map());
  const [loading, setLoading] = useState(false);
  const [controlsExpanded, setControlsExpanded] = useState(true);
  const [uploadsCollapsed, setUploadsCollapsed] = useState(false);
  const [hasSessionData, setHasSessionData] = useState(false);
  const [dropzoneResetKey, setDropzoneResetKey] = useState(0);
  const airportLoadAttempted = useRef(false);
  const hadCompleteDataset = useRef(false);
  const apiSourceRef = useRef<{ text: string; fileName: string } | null>(null);
  const clientSourceRef = useRef<{ text: string; fileName: string } | null>(null);

  useEffect(() => {
    async function loadAirports() {
      try {
        const response = await fetch("/api/airports");
        if (!response.ok) {
          throw new Error(`Airports request failed: ${response.status}`);
        }
        const data = (await response.json()) as { airports: AirportReference[] };
        setAirportMap(buildAirportMap(data.airports ?? []));
      } catch {
        setAirportMap(new Map());
      } finally {
        setAirportsLoaded(true);
        airportLoadAttempted.current = true;
      }
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
  const hasCompleteDataset = Boolean(apiResult && clientResult);

  useEffect(() => {
    if (hasCompleteDataset && !hadCompleteDataset.current) {
      setUploadsCollapsed(true);
    }

    hadCompleteDataset.current = hasCompleteDataset;
  }, [hasCompleteDataset]);

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
    setHasSessionData(true);
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
    setHasSessionData(true);
    setResults(buildCombinedResults(nextApi, nextClient));
    setLoading(false);
  }

  function handleCleanData() {
    apiSourceRef.current = null;
    clientSourceRef.current = null;
    hadCompleteDataset.current = false;
    setHasSessionData(false);
    setControlsExpanded(true);
    setUploadsCollapsed(false);
    setDropzoneResetKey((current) => current + 1);
    resetAppState();
  }

  return (
    <main className="app-shell min-h-screen px-4 py-6 text-slate-900 transition dark:text-slate-100 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <Surface as="section" variant="panelStrong" className="hero-shell relative overflow-hidden rounded-[2.75rem] p-6 md:p-8">
          <div className="absolute right-5 top-5 z-10 md:right-6 md:top-6">
            <ThemeToggle />
          </div>
          <div className="relative">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-4 pr-20 md:pr-24">
                <BrandLogo className="w-[148px] md:w-[172px]" />
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[0.96] text-slate-950 dark:text-white md:text-6xl xl:text-[4.35rem]">
                Destination Overlap Mapper
              </h1>
              <p className="muted-copy mt-5 max-w-2xl text-base md:text-lg">
                Compare API and client airport data from CSV files, plot locations on a map, and view overlap % plus potential overlap % from API’s worldwide coverage.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/admin"
                  className="brand-btn-secondary inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition"
                >
                  Admin Login
                </a>
                <Button
                  onClick={handleLoadDemo}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load Demo Data"}
                </Button>
                {hasSessionData ? (
                  <Button
                    onClick={handleCleanData}
                    disabled={loading}
                    variant="danger"
                  >
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13.25 2.75v3.5h-3.5" />
                      <path d="M2.75 13.25v-3.5h3.5" />
                      <path d="M4.2 6.1A4.75 4.75 0 0 1 12.9 4" />
                      <path d="M11.8 9.9A4.75 4.75 0 0 1 3.1 12" />
                    </svg>
                    <span>Start Over</span>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </Surface>

        {!apiResult || !clientResult ? (
          <Surface as="section" variant="panelSoft" className="rounded-[2.2rem] border-dashed p-10 text-center">
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Start with two CSVs or load the demo</h2>
            <p className="muted-copy mt-3">
              {`The app will validate uploads, combine duplicates, flag unknown IATA codes, and render API-only, ${clientOnlyLabel.toLowerCase()}, and overlap destinations together.`}
            </p>
          </Surface>
        ) : null}

        <section className="space-y-4">
          <Surface variant="panel" className="rounded-[2.2rem] p-4 md:p-5">
            <SectionHeader
              eyebrow="Uploads"
              title={hasCompleteDataset ? "Data Loaded & Ready" : "Load Your Comparison Files"}
              description={
                hasCompleteDataset
                  ? "Both datasets are active. Expand this section any time to replace either file."
                  : "Upload both datasets or load the demo to begin the overlap comparison."
              }
              className="flex-col gap-4 md:flex-row md:items-center"
              meta={
                hasCompleteDataset ? (
                  <Button
                    onClick={() => setUploadsCollapsed((current) => !current)}
                    variant="secondary"
                    size="sm"
                    className="self-start text-slate-600 dark:text-slate-300"
                  >
                    <span>{uploadsCollapsed ? "Change Files" : "Collapse"}</span>
                    <span aria-hidden="true" className={`text-xs transition ${uploadsCollapsed ? "" : "rotate-180"}`}>⌄</span>
                  </Button>
                ) : null
              }
            />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <InfoCard title="API dataset" description={apiResult?.fileName ?? "Not loaded"}>
                <p>{apiValidation.summary}</p>
                <div className="mt-3">
                  <ValidationPanel result={apiResult} title="API validation details" compact />
                </div>
              </InfoCard>
              <InfoCard title={`${clientDisplayName} dataset`} description={clientResult?.fileName ?? "Not loaded"}>
                <p>{clientValidation.summary}</p>
                <div className="mt-3">
                  <ValidationPanel result={clientResult} title={`${clientDisplayName} validation details`} compact />
                </div>
              </InfoCard>
            </div>
            <CollapsiblePanel expanded={!uploadsCollapsed} className="mt-5">
              <div className="grid gap-6 lg:grid-cols-2">
                <FileDropzone
                  label="API DESTINATIONS COVERAGE"
                  onFileSelect={(file) => void handleFile(file, "api")}
                  disabled={loading || !airportsLoaded}
                  statusText={!airportsLoaded ? "Loading airport reference data..." : loading ? "Processing file..." : undefined}
                  templateLabel="API Upload Template"
                  resetKey={dropzoneResetKey}
                  onTemplateDownload={() =>
                    downloadTextFile("api-template.csv", "IATA,volume\nLHR,320\nJFK,220\n")
                  }
                />
                <FileDropzone
                  label={`${clientDisplayName} Layovers`}
                  onFileSelect={(file) => void handleFile(file, "client")}
                  disabled={loading || !airportsLoaded}
                  statusText={!airportsLoaded ? "Loading airport reference data..." : loading ? "Processing file..." : undefined}
                  templateLabel={`${clientDisplayName} Upload Template`}
                  resetKey={dropzoneResetKey}
                  onTemplateDownload={() =>
                    downloadTextFile("client-template.csv", "IATA,volume\nSIN,150\nLHR,290\n")
                  }
                />
              </div>
            </CollapsiblePanel>
          </Surface>
        </section>

        <section>
          <Surface variant="panel" className="rounded-[2.2rem] p-5 md:p-6">
            <SectionHeader
              eyebrow="Controls"
              title="Tune the View"
              description="Adjust the active client label, focus the map by region, and fine-tune how each category appears."
              meta={
                <Button
                  onClick={() => setControlsExpanded((current) => !current)}
                  variant="secondary"
                  size="sm"
                  className="text-slate-600 dark:text-slate-300"
                  aria-expanded={controlsExpanded}
                  aria-controls="controls-panel"
                >
                  <span>{controlsExpanded ? "Collapse" : "Expand"}</span>
                  <span className={`text-xs transition ${controlsExpanded ? "rotate-180" : ""}`}>⌃</span>
                </Button>
              }
            />
            <CollapsiblePanel expanded={controlsExpanded} id="controls-panel" className="mt-6">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
                <Surface variant="panelSoft" className="rounded-[1.9rem] p-4 md:p-5">
                  <div>
                    <p className="section-eyebrow">Data View</p>
                    <p className="muted-copy mt-2 text-sm">Set the client label, define the volume units used in the comparison, and narrow the map to a specific region.</p>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-100">Client Name</span>
                      <InputField
                        value={clientName}
                        onChange={(event) => setClientName(event.target.value)}
                        placeholder="Enter Client Name"
                        className="rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
                      />
                      <p className="muted-copy mt-2 text-xs">Used in section titles, map labels, and summary cards.</p>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-100">Volume Units</span>
                      <InputField
                        value={volumeUnits}
                        onChange={(event) => setVolumeUnits(event.target.value)}
                        placeholder="Rooms, contracts, nights..."
                        className="rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
                      />
                      <p className="muted-copy mt-2 text-xs">Defines what the uploaded volume values represent across the comparison.</p>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-100">Region Filter</span>
                      <SelectField
                        value={region}
                        onChange={(event) => setRegion(event.target.value)}
                        className="text-sm"
                      >
                        <option>{REGION_ALL}</option>
                        {regions.map((regionValue) => (
                          <option key={regionValue}>{regionValue}</option>
                        ))}
                      </SelectField>
                      <p className="muted-copy mt-2 text-xs">
                        Showing {formatNumber(filteredPoints.length)} mapped destinations in {region === REGION_ALL ? "all regions" : region}.
                      </p>
                    </label>
                  </div>
                </Surface>
                <Surface variant="panelSoft" className="rounded-[1.9rem] p-4 md:p-5">
                  <p className="section-eyebrow">Appearance</p>
                  <div className="mt-1 flex items-center justify-between gap-4">
                    <p className="muted-copy text-sm">Choose the marker colors used for each destination category.</p>
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Map Colors</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <ColorPicker label="API Destinations" value={colors.apiOnly} onChange={(value) => setColor("apiOnly", value)} />
                    <ColorPicker
                      label={`${clientDisplayName} Destinations`}
                      value={colors.clientOnly}
                      onChange={(value) => setColor("clientOnly", value)}
                    />
                    <ColorPicker label="Overlap" value={colors.overlap} onChange={(value) => setColor("overlap", value)} />
                  </div>
                </Surface>
              </div>
            </CollapsiblePanel>
          </Surface>
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
                    <div className="brand-divider hidden w-px sm:block" aria-hidden="true" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Potential Overlap %</p>
                        <div className="group/tooltip relative">
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-(--panel-border) text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            i
                          </span>
                          <div className="brand-surface pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-2xl p-3 text-xs normal-case tracking-normal text-slate-600 shadow-lg shadow-slate-300/20 backdrop-blur group-hover/tooltip:block dark:text-slate-300 dark:shadow-none">
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
          <OverlapMap points={filteredPoints} region={region} clientLabel={clientDisplayName} volumeUnitsLabel={volumeUnitsLabel} colors={colors} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.35fr]">
          <TopOverlapList rows={summary.topOverlapAirports} clientLabel={clientDisplayName} volumeUnitsLabel={volumeUnitsLabel} />
          <DataTable
            title="Overlap Destinations"
            rows={categorizedRows.overlap}
            volumeColumns="both"
            defaultSort="client-volume"
            clientLabel={clientDisplayName}
            volumeUnitsLabel={volumeUnitsLabel}
            variant="feature"
            bodyHeight="large"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <DataTable title="API-Only Destinations" rows={categorizedRows.apiOnly} volumeColumns="api" volumeUnitsLabel={volumeUnitsLabel} bodyHeight="medium" />
          <DataTable
            title={`${clientOnlyLabel} Destinations`}
            rows={categorizedRows.clientOnly}
            volumeColumns="client"
            clientLabel={clientDisplayName}
            volumeUnitsLabel={volumeUnitsLabel}
            bodyHeight="medium"
          />
        </section>
      </div>
    </main>
  );
}
