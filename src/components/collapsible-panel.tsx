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
        expanded ? "grid-rows-[1fr] opacity-100 translate-y-0" : "grid-rows-[0fr] opacity-0 -translate-y-1",
        className
      )}
    >
      <div className={cn("min-h-0 overflow-hidden", contentClassName)}>{children}</div>
    </div>
  );
}
