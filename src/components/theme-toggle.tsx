"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function SunIcon({ active }: { active: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={cn("h-3.5 w-3.5", active ? "text-amber-500" : "text-slate-400/80 dark:text-slate-500")}>
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
    <svg aria-hidden="true" viewBox="0 0 24 24" className={cn("h-3.5 w-3.5", active ? "text-slate-800 dark:text-slate-100" : "text-slate-400/80 dark:text-slate-500")}>
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
        "inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/75 px-2.5 py-1.5 shadow-sm backdrop-blur transition-colors duration-200 dark:border-white/10 dark:bg-slate-950/65",
        "text-slate-900 hover:bg-white dark:text-slate-100 dark:hover:bg-slate-950"
      )}
    >
      <span className="flex items-center gap-1.5">
        <SunIcon active={!isDark} />
        <span
          aria-hidden="true"
          className={cn(
            "relative flex h-5.5 w-10 items-center rounded-full p-0.5 transition-colors duration-200",
            isDark ? "bg-lime-500/85" : "bg-lime-400/70"
          )}
        >
          <span
            className={cn(
              "h-4.5 w-4.5 rounded-full bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.12)] transition-transform duration-200 dark:bg-slate-100/95",
              isDark ? "translate-x-4.5" : "translate-x-0"
            )}
          />
        </span>
        <MoonIcon active={isDark} />
      </span>
      <span className="sr-only">{isDark ? "Dark Mode Enabled" : "Light Mode Enabled"}</span>
    </button>
  );
}
