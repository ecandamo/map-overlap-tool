import { InfoCard } from "@/components/ui/info-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Surface } from "@/components/ui/surface";
import { MapPoint } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

type TopOverlapListProps = {
  rows: MapPoint[];
  clientLabel?: string;
  volumeUnitsLabel?: string;
};

export function TopOverlapList({ rows, clientLabel = "Client", volumeUnitsLabel = "Volume" }: TopOverlapListProps) {
  return (
    <Surface as="section" variant="panel" className="rounded-[2rem] p-5">
      <SectionHeader eyebrow="Leaderboard" title="Top 3 Overlap Airports" meta={<span className="text-sm text-slate-500 dark:text-slate-400">{rows.length} Ranked</span>} />
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Upload Both Files and Keep at Least One Overlapping Airport in the Current Region to See Rankings.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={row.iata} className="rounded-[1.5rem] border border-black/5 bg-slate-100/80 px-4 py-4 dark:border-white/10 dark:bg-slate-900/60">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs shadow-sm dark:bg-slate-950/80">
                    {index + 1}
                  </span>
                  {row.iata} · {row.city}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{row.country} · {row.region}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <InfoCard title={`API ${volumeUnitsLabel}`} description={formatNumber(row.apiVolume)} className="rounded-2xl bg-white/80 px-3 py-2 dark:bg-slate-950/70" />
                <InfoCard title={`${clientLabel} ${volumeUnitsLabel}`} description={formatNumber(row.clientVolume)} className="rounded-2xl bg-white/80 px-3 py-2 dark:bg-slate-950/70" />
              </div>
            </div>
          ))}
        </div>
      )}
    </Surface>
  );
}
