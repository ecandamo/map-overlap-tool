import { ReactNode } from "react";

type SummaryCardProps = {
  label: string;
  value: string;
  accent?: string;
  detail?: ReactNode;
  eyebrow?: ReactNode;
  variant?: "default" | "feature";
  valueSize?: "default" | "large";
  hideValue?: boolean;
};

export function SummaryCard({ label, value, accent, detail, eyebrow, variant = "default", valueSize = "default", hideValue = false }: SummaryCardProps) {
  const valueClassName =
    variant === "feature"
      ? "text-4xl font-semibold text-slate-950 dark:text-white"
      : valueSize === "large"
        ? "text-5xl font-semibold text-slate-950 dark:text-white"
        : "text-3xl font-semibold text-slate-950 dark:text-white";

  return (
    <div
      className={
        variant === "feature"
          ? "relative rounded-[2rem] border border-black/10 bg-white/92 p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
          : "relative rounded-[1.85rem] border border-black/10 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
      }
    >
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.08),transparent_20%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(94,234,212,0.08),transparent_20%)]" />
      <div className="relative">
        {eyebrow ? (
          <div className={`${hideValue ? "mb-1.5" : "mb-3"} text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500`}>
            {eyebrow}
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          {accent ? <span className="mt-1 h-2.5 w-10 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.55)] dark:shadow-none" style={{ backgroundColor: accent }} /> : null}
        </div>
        {!hideValue ? (
          <div className="mt-4 flex items-end gap-3">
            <p className={valueClassName}>{value}</p>
          </div>
        ) : null}
        {detail ? <div className={`${hideValue ? "mt-2" : "mt-3"} text-sm text-slate-600 dark:text-slate-300`}>{detail}</div> : null}
      </div>
    </div>
  );
}
