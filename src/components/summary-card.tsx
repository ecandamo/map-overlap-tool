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
          ? "rounded-[1.9rem] border border-black/10 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
          : "rounded-[1.75rem] border border-black/10 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
      }
    >
      {eyebrow ? (
        <div className={`${hideValue ? "mb-1.5" : "mb-3"} text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500`}>
          {eyebrow}
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        {accent ? <span className="mt-1 h-2.5 w-10 rounded-full" style={{ backgroundColor: accent }} /> : null}
      </div>
      {!hideValue ? (
        <div className="mt-4 flex items-end gap-3">
          <p className={valueClassName}>{value}</p>
        </div>
      ) : null}
      {detail ? <div className={`${hideValue ? "mt-2" : "mt-3"} text-sm text-slate-600 dark:text-slate-300`}>{detail}</div> : null}
    </div>
  );
}
