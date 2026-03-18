import { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

type InfoCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function InfoCard({ title, description, children, className }: InfoCardProps) {
  return (
    <Surface variant="brand" className={cn("rounded-[1.5rem] px-4 py-3", className)}>
      {title ? <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</p> : null}
      {description ? <p className={cn(title ? "mt-1" : "", "text-sm font-semibold text-slate-900 dark:text-slate-100")}>{description}</p> : null}
      {children ? <div className={cn(title || description ? "mt-2" : "", "text-sm text-slate-600 dark:text-slate-300")}>{children}</div> : null}
    </Surface>
  );
}
