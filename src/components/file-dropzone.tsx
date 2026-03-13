"use client";

import { ChangeEvent, DragEvent, KeyboardEvent, MouseEvent, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type ValidationTooltip = {
  statusLabel: string;
  statusTone: "neutral" | "good" | "warning";
  summary: string;
  details?: string[];
};

type FileDropzoneProps = {
  label: string;
  description: string;
  onFileSelect: (file: File) => void;
  statusText?: string;
  disabled?: boolean;
  validation?: ValidationTooltip;
  templateLabel?: string;
  onTemplateDownload?: () => void;
};

export function FileDropzone({ label, description, onFileSelect, statusText, disabled = false, validation, templateLabel, onTemplateDownload }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (disabled) {
      return;
    }
    const file = files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files);
  }

  function openPicker() {
    if (disabled) {
      return;
    }
    inputRef.current?.click();
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) {
      return;
    }
    handleFiles(event.dataTransfer.files);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  }

  function onTemplateClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onTemplateDownload?.();
  }

  function onValidationClick(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  const isGoodStatus = validation?.statusTone === "good";

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={openPicker}
      onKeyDown={onKeyDown}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) {
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "panel-wash group relative flex min-h-60 w-full flex-col items-start justify-between rounded-[2.2rem] border-2 border-dashed p-6 text-left transition",
        disabled
          ? "cursor-not-allowed border-black/10 bg-white/60 opacity-75 dark:border-white/10 dark:bg-white/5"
          : dragging
          ? "border-sky-500 bg-sky-500/10"
          : "border-black/10 bg-white/75 hover:border-slate-400 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      )}
    >
      {validation ? (
        <div className="group/validation absolute right-5 top-5 z-10" onClick={onValidationClick}>
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
              validation.statusTone === "warning"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
                : validation.statusTone === "good"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {isGoodStatus ? (
              <>
                <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3.5 8.5 2.5 2.5 6-6" />
                </svg>
                <span className="sr-only">{validation.statusLabel}</span>
              </>
            ) : (
              validation.statusLabel
            )}
          </span>
          {validation.details && validation.details.length > 0 ? (
            <div className="pointer-events-none absolute right-0 top-full z-20 mt-3 hidden w-72 rounded-2xl border border-black/10 bg-white/95 p-3 text-left text-xs text-slate-600 shadow-lg shadow-slate-300/30 backdrop-blur group-hover/validation:block dark:border-white/10 dark:bg-slate-950/95 dark:text-slate-300 dark:shadow-none">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Validation details</p>
              <ul className="mt-2 space-y-1.5">
                {validation.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="relative z-[1] w-full">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white dark:bg-white dark:text-slate-900">
            {label}
          </span>
          <div>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Drop CSV here or click to upload</h3>
            <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">{description}</p>
          </div>
        </div>
      </div>
      <div className="relative z-[1] mt-8 w-full">
        <div className="rounded-[1.7rem] border border-black/10 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Upload Format</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">CSV file, first file only, validated against the airport reference set.</p>
            </div>
            <span className="subtle-chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
              {disabled ? "Working..." : "Drag and drop enabled"}
            </span>
          </div>
          {templateLabel && onTemplateDownload ? (
            <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300">
              Download {templateLabel}{" "}
              <button
                type="button"
                onClick={onTemplateClick}
                className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 transition hover:text-sky-800 dark:text-sky-300 dark:decoration-sky-700 dark:hover:text-sky-200"
              >
                here
              </button>
              .
            </p>
          ) : null}
        </div>
      </div>
      {statusText ? <div className="relative z-[1] w-full text-sm text-slate-500 dark:text-slate-400">{statusText}</div> : null}
      <input ref={inputRef} hidden type="file" accept=".csv,text/csv" onChange={onChange} disabled={disabled} />
    </div>
  );
}
