import { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";

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
    <Surface
      variant="brand"
      className={
        variant === "feature"
          ? "relative rounded-[2rem] p-5 shadow-sm"
          : "relative rounded-[1.85rem] p-5 shadow-sm"
      }
    >
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_top_right,var(--brand-accent-soft),transparent_20%)] dark:bg-[radial-gradient(circle_at_top_right,var(--brand-highlight-soft),transparent_24%)]" />
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
    </Surface>
  );
}
