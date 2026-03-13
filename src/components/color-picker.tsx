"use client";

type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-xs font-medium text-slate-700 backdrop-blur dark:bg-slate-950/50 dark:text-slate-200">
      <span className="relative h-4 w-4 shrink-0">
        <span className="absolute inset-0 rounded-full" style={{ backgroundColor: value }} />
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={`${label} Color`}
        />
      </span>
      <span>{label}</span>
    </label>
  );
}
