"use client";

import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CollapsiblePanelProps = {
  expanded: boolean;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  id?: string;
};

export function CollapsiblePanel({ expanded, children, className, contentClassName, id }: CollapsiblePanelProps) {
  return (
    <div
      id={id}
      aria-hidden={!expanded}
      className={cn(
        "grid overflow-hidden transition-[grid-template-rows,opacity,transform] duration-300 ease-out",
        expanded
          ? "grid-rows-[1fr] translate-y-0 opacity-100"
          : "pointer-events-none grid-rows-[0fr] -translate-y-1 opacity-0",
        className
      )}
    >
      <div className={cn("min-h-0 overflow-hidden", contentClassName)}>{children}</div>
    </div>
  );
}
