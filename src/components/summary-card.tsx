import { ReactNode } from "react";

type SummaryCardProps = {
  label: string;
  value: string;
  accent?: string;
  detail?: ReactNode;
};

export function SummaryCard({ label, value, accent, detail }: SummaryCardProps) {
  return (
    <div className="rounded-[1.75rem] border border-black/10 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <div className="mt-3 flex items-end gap-3">
        <p className="text-3xl font-semibold text-slate-950 dark:text-white">{value}</p>
        {accent ? <span className="mb-1 h-3 w-3 rounded-full" style={{ backgroundColor: accent }} /> : null}
      </div>
      {detail ? <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{detail}</div> : null}
    </div>
  );
}
