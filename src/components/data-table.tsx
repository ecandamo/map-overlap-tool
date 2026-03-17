import { useMemo, useState } from "react";

import { MapPoint } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

type DataTableProps = {
  title: string;
  rows: MapPoint[];
  volumeColumns?: "api" | "client" | "both";
  defaultSort?: "total-volume" | "client-volume";
  clientLabel?: string;
  volumeUnitsLabel?: string;
  variant?: "default" | "feature";
  bodyHeight?: "default" | "medium" | "large";
};

export function DataTable({
  title,
  rows,
  volumeColumns = "both",
  defaultSort = "total-volume",
  clientLabel = "Client",
  volumeUnitsLabel = "Volume",
  variant = "default",
  bodyHeight = "default"
}: DataTableProps) {
  const [search, setSearch] = useState("");
  const sortedRows = useMemo(() => {
    const shouldSortByClientVolume = defaultSort === "client-volume" && rows.some((row) => row.clientVolume > 0);

    return [...rows].sort((a, b) => {
      if (shouldSortByClientVolume) {
        const clientVolumeDiff = b.clientVolume - a.clientVolume;
        if (clientVolumeDiff !== 0) {
          return clientVolumeDiff;
        }
      }

      return b.totalVolume - a.totalVolume || a.iata.localeCompare(b.iata);
    });
  }, [defaultSort, rows]);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return sortedRows;
    }

    return sortedRows.filter((row) =>
      [row.iata, row.city, row.country, row.region].some((value) => value.toLowerCase().includes(query))
    );
  }, [search, sortedRows]);
  const showApiVolume = volumeColumns === "api" || volumeColumns === "both";
  const showClientVolume = volumeColumns === "client" || volumeColumns === "both";
  const columnCount = 4 + (showApiVolume ? 1 : 0) + (showClientVolume ? 1 : 0);
  const bodyHeightClassName =
    bodyHeight === "large" ? "max-h-[32rem]" : bodyHeight === "medium" ? "max-h-[26rem]" : "";

  return (
    <section
      className={
        variant === "feature"
          ? "panel-strong rounded-[2rem] p-5"
          : "panel rounded-[2rem] p-5"
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="section-eyebrow">Data Grid</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">{filteredRows.length} Airports</span>
      </div>
      <div className="mb-4">
        <label className="relative block">
          <span className="sr-only">{`Search ${title}`}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8.5" cy="8.5" r="4.75" />
            <path d="M12 12l4.25 4.25" />
          </svg>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by IATA, City, Country, or Region"
            className="brand-input w-full rounded-[1.6rem] px-5 py-3.5 pl-11 text-base placeholder:text-slate-500 dark:placeholder:text-slate-400"
            aria-label={`Search ${title}`}
          />
        </label>
      </div>
      <div className={`overflow-x-auto rounded-[1.5rem] border border-black/5 bg-white/55 dark:border-white/10 dark:bg-white/5 ${bodyHeightClassName} ${bodyHeight !== "default" ? "overflow-y-auto" : ""}`}>
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-white/90 text-left text-slate-500 backdrop-blur dark:bg-slate-950/90 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">IATA</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Region</th>
              {showApiVolume ? <th className="px-4 py-3">API {volumeUnitsLabel}</th> : null}
              {showClientVolume ? <th className="px-4 py-3">{clientLabel} {volumeUnitsLabel}</th> : null}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-4 py-5 text-slate-500 dark:text-slate-400">
                  {search.trim() ? "No destinations match the current search." : "No Destinations in This Segment for the Current Region Filter."}
                </td>
              </tr>
            ) : null}
            {filteredRows.map((row) => (
              <tr key={row.iata} className="border-t border-black/5 transition hover:bg-slate-50/70 dark:border-white/10 dark:hover:bg-white/5">
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{row.iata}</td>
                <td className="px-4 py-3">{row.city}</td>
                <td className="px-4 py-3">{row.country}</td>
                <td className="px-4 py-3">{row.region}</td>
                {showApiVolume ? <td className="px-4 py-3">{formatNumber(row.apiVolume)}</td> : null}
                {showClientVolume ? <td className="px-4 py-3">{formatNumber(row.clientVolume)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
