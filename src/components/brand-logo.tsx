"use client";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  priority?: "compact" | "full";
};

export function BrandLogo({ className, priority = "full" }: BrandLogoProps) {
  const darkLogo = priority === "compact" ? "/brand/API-white.svg" : "/brand/API-green-white.svg";

  return (
    <div className={cn("inline-flex items-center", className)}>
      <img src="/brand/API-green.svg" alt="API Global Solutions" className="block h-auto w-full dark:hidden" />
      <img src={darkLogo} alt="API Global Solutions" className="hidden h-auto w-full dark:block" />
    </div>
  );
}
