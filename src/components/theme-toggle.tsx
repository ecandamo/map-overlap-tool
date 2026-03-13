"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function SunIcon({ active }: { active: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={cn("h-4 w-4", active ? "text-amber-500" : "text-slate-400 dark:text-slate-500")}>
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <g stroke="currentColor" strokeLinecap="round" strokeWidth="1.8">
        <path d="M12 2.75v2.5" />
        <path d="M12 18.75v2.5" />
        <path d="M21.25 12h-2.5" />
        <path d="M5.25 12h-2.5" />
        <path d="M18.54 5.46l-1.77 1.77" />
        <path d="M7.23 16.77l-1.77 1.77" />
        <path d="M18.54 18.54l-1.77-1.77" />
        <path d="M7.23 7.23L5.46 5.46" />
      </g>
    </svg>
  );
}

function MoonIcon({ active }: { active: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={cn("h-4 w-4", active ? "text-slate-950 dark:text-slate-50" : "text-slate-400 dark:text-slate-500")}>
      <path
        fill="currentColor"
        d="M14.9 2.8a1 1 0 0 0-1.21 1.27 8.2 8.2 0 0 1-10.2 10.2 1 1 0 0 0-1.27 1.21A10.25 10.25 0 1 0 14.9 2.8Z"
      />
    </svg>
  );
}

export function ThemeToggle() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex items-center gap-3 rounded-full border px-3 py-2 transition-colors duration-200",
        "border-black/10 bg-white/85 text-slate-900 shadow-sm hover:bg-white dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100 dark:hover:bg-slate-950"
      )}
    >
      <span className="flex items-center gap-2">
        <SunIcon active={!isDark} />
        <span
          aria-hidden="true"
          className={cn(
            "relative flex h-7 w-12 items-center rounded-full p-1 transition-colors duration-200",
            isDark ? "bg-slate-700" : "bg-slate-200"
          )}
        >
          <span
            className={cn(
              "h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 dark:bg-slate-50",
              isDark ? "translate-x-5" : "translate-x-0"
            )}
          />
        </span>
        <MoonIcon active={isDark} />
      </span>
      <span className="sr-only">{isDark ? "Dark Mode Enabled" : "Light Mode Enabled"}</span>
    </button>
  );
}
