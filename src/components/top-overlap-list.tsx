import { MapPoint } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

type TopOverlapListProps = {
  rows: MapPoint[];
  clientLabel?: string;
};

export function TopOverlapList({ rows, clientLabel = "Client" }: TopOverlapListProps) {
  return (
    <section className="rounded-[2rem] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Top Overlap Airports</h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">{rows.length} Ranked</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Upload Both Files and Keep at Least One Overlapping Airport in the Current Region to See Rankings.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={row.iata} className="flex items-center justify-between rounded-[1.25rem] bg-slate-100/80 px-4 py-3 dark:bg-slate-900/60">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  {index + 1}. {row.iata} · {row.city}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  API {formatNumber(row.apiVolume)} · {clientLabel} {formatNumber(row.clientVolume)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">{formatNumber(row.totalVolume)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Combined Volume</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
