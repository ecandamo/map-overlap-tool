"use client";

type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <label className="brand-surface flex items-center justify-between gap-4 rounded-[1.4rem] px-4 py-3 text-sm text-slate-700 shadow-sm transition hover:bg-[color-mix(in_srgb,var(--panel-strong)_96%,transparent)] dark:text-slate-200">
      <span className="flex min-w-0 items-center gap-3">
        <span className="relative h-8 w-8 shrink-0 rounded-full border border-[var(--panel-border)] bg-[color-mix(in_srgb,var(--panel-strong)_80%,transparent)] p-1">
          <span className="absolute inset-[4px] rounded-full border border-[var(--panel-border)]" style={{ backgroundColor: value }} />
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
      <span className="brand-badge rounded-full px-2.5 py-1 font-mono text-xs uppercase tracking-[0.12em]">
        {value}
      </span>
    </label>
  );
}
