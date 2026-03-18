import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return <span className={cn("brand-badge inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]", className)}>{children}</span>;
}
