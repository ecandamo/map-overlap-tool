"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition",
        "border-black/10 bg-white/80 text-slate-900 hover:bg-white dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-900"
      )}
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs dark:bg-slate-800">
        {theme === "light" ? "D" : "L"}
      </span>
      {theme === "light" ? "Dark mode" : "Light mode"}
    </button>
  );
}
