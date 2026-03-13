"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type FileDropzoneProps = {
  label: string;
  description: string;
  onFileSelect: (file: File) => void;
  statusText?: string;
};

export function FileDropzone({ label, description, onFileSelect, statusText }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files);
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "group flex min-h-52 w-full flex-col items-start justify-between rounded-[2rem] border p-6 text-left transition",
        dragging
          ? "border-sky-500 bg-sky-500/10"
          : "border-black/10 bg-white/80 hover:border-slate-400 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      )}
    >
      <div className="space-y-3">
        <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white dark:bg-white dark:text-slate-900">
          {label}
        </span>
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Drop CSV here or click to upload</h3>
          <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">{description}</p>
        </div>
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400">{statusText ?? "CSV only. Duplicate IATA rows are combined automatically."}</div>
      <input ref={inputRef} hidden type="file" accept=".csv,text/csv" onChange={onChange} />
    </button>
  );
}
