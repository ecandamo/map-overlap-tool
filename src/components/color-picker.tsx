"use client";

type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200">
      <span className="flex min-w-0 items-center gap-3">
        <span className="relative h-5 w-5 shrink-0">
          <span className="absolute inset-0 rounded-full border border-black/10" style={{ backgroundColor: value }} />
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={`${label} Color`}
          />
        </span>
        <span className="truncate font-medium">{label}</span>
      </span>
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{value}</span>
    </label>
  );
}
