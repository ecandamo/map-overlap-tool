import { useMemo } from "react";

import { MapPoint } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

type DataTableProps = {
  title: string;
  rows: MapPoint[];
  volumeColumns?: "api" | "client" | "both";
};

export function DataTable({ title, rows, volumeColumns = "both" }: DataTableProps) {
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => b.totalVolume - a.totalVolume || a.iata.localeCompare(b.iata)),
    [rows]
  );
  const showApiVolume = volumeColumns === "api" || volumeColumns === "both";
  const showClientVolume = volumeColumns === "client" || volumeColumns === "both";
  const columnCount = 4 + (showApiVolume ? 1 : 0) + (showClientVolume ? 1 : 0);

  return (
    <section className="rounded-[2rem] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">{rows.length} Airports</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-slate-500 dark:text-slate-400">
            <tr>
              <th className="pb-3 pr-4">IATA</th>
              <th className="pb-3 pr-4">City</th>
              <th className="pb-3 pr-4">Country</th>
              <th className="pb-3 pr-4">Region</th>
              {showApiVolume ? <th className="pb-3 pr-4">API Volume</th> : null}
              {showClientVolume ? <th className="pb-3">Client Volume</th> : null}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="py-5 text-slate-500 dark:text-slate-400">
                  No Destinations in This Segment for the Current Region Filter.
                </td>
              </tr>
            ) : null}
            {sortedRows.map((row) => (
              <tr key={row.iata} className="border-t border-black/5 dark:border-white/10">
                <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100">{row.iata}</td>
                <td className="py-3 pr-4">{row.city}</td>
                <td className="py-3 pr-4">{row.country}</td>
                <td className="py-3 pr-4">{row.region}</td>
                {showApiVolume ? <td className="py-3 pr-4">{formatNumber(row.apiVolume)}</td> : null}
                {showClientVolume ? <td className="py-3">{formatNumber(row.clientVolume)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
