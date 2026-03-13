"use client";

type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <label className="flex items-center gap-3 rounded-full border border-black/10 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-8 w-8 rounded-full border-0 bg-transparent p-0" />
      <span>{label}</span>
    </label>
  );
}
