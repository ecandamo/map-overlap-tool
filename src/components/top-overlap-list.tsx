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
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Top 3 Overlap Airports</h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">{rows.length} Ranked</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Upload Both Files and Keep at Least One Overlapping Airport in the Current Region to See Rankings.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={row.iata} className="rounded-[1.25rem] bg-slate-100/80 px-4 py-3 dark:bg-slate-900/60">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs dark:bg-slate-950/80">
                    {index + 1}
                  </span>
                  {row.iata} · {row.city}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{row.country} · {row.region}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-white/80 px-3 py-2 dark:bg-slate-950/70">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">API</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{formatNumber(row.apiVolume)}</p>
                </div>
                <div className="rounded-2xl bg-white/80 px-3 py-2 dark:bg-slate-950/70">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{clientLabel}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{formatNumber(row.clientVolume)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
