import { useMemo } from "react";

import { MapPoint } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

type DataTableProps = {
  title: string;
  rows: MapPoint[];
};

export function DataTable({ title, rows }: DataTableProps) {
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => b.totalVolume - a.totalVolume || a.iata.localeCompare(b.iata)),
    [rows]
  );

  return (
    <section className="rounded-[2rem] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">{rows.length} airports</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-slate-500 dark:text-slate-400">
            <tr>
              <th className="pb-3 pr-4">IATA</th>
              <th className="pb-3 pr-4">City</th>
              <th className="pb-3 pr-4">Country</th>
              <th className="pb-3 pr-4">Region</th>
              <th className="pb-3 pr-4">API Volume</th>
              <th className="pb-3">Client Volume</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-5 text-slate-500 dark:text-slate-400">
                  No destinations in this segment for the current region filter.
                </td>
              </tr>
            ) : null}
            {sortedRows.map((row) => (
              <tr key={row.iata} className="border-t border-black/5 dark:border-white/10">
                <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100">{row.iata}</td>
                <td className="py-3 pr-4">{row.city}</td>
                <td className="py-3 pr-4">{row.country}</td>
                <td className="py-3 pr-4">{row.region}</td>
                <td className="py-3 pr-4">{formatNumber(row.apiVolume)}</td>
                <td className="py-3">{formatNumber(row.clientVolume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
