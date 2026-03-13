import { MapPoint } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

type TopOverlapListProps = {
  rows: MapPoint[];
};

export function TopOverlapList({ rows }: TopOverlapListProps) {
  return (
    <section className="rounded-[2rem] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Top overlap airports</h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">{rows.length} ranked</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Upload both files and keep at least one overlapping airport in the current region to see rankings.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={row.iata} className="flex items-center justify-between rounded-[1.25rem] bg-slate-100/80 px-4 py-3 dark:bg-slate-900/60">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  {index + 1}. {row.iata} · {row.city}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  API {formatNumber(row.apiVolume)} · Client {formatNumber(row.clientVolume)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">{formatNumber(row.totalVolume)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">combined volume</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
