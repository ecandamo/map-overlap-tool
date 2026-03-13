import { useMemo } from "react";

import { MapPoint } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

type DataTableProps = {
  title: string;
  rows: MapPoint[];
  volumeColumns?: "api" | "client" | "both";
  clientLabel?: string;
  volumeUnitsLabel?: string;
  variant?: "default" | "feature";
  bodyHeight?: "default" | "medium" | "large";
};

export function DataTable({
  title,
  rows,
  volumeColumns = "both",
  clientLabel = "Client",
  volumeUnitsLabel = "Volume",
  variant = "default",
  bodyHeight = "default"
}: DataTableProps) {
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => b.totalVolume - a.totalVolume || a.iata.localeCompare(b.iata)),
    [rows]
  );
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
        <span className="text-sm text-slate-500 dark:text-slate-400">{rows.length} Airports</span>
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
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-4 py-5 text-slate-500 dark:text-slate-400">
                  No Destinations in This Segment for the Current Region Filter.
                </td>
              </tr>
            ) : null}
            {sortedRows.map((row) => (
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
