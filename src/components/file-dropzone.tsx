"use client";

import { ChangeEvent, DragEvent, KeyboardEvent, MouseEvent, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type FileDropzoneProps = {
  label: string;
  onFileSelect: (file: File) => void;
  statusText?: string;
  disabled?: boolean;
  templateLabel?: string;
  onTemplateDownload?: () => void;
  resetKey?: number;
};

export function FileDropzone({
  label,
  onFileSelect,
  statusText,
  disabled = false,
  templateLabel,
  onTemplateDownload,
  resetKey = 0
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [resetKey]);

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
    event.target.value = "";
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
          ? "cursor-not-allowed border-[var(--panel-border)] bg-[color-mix(in_srgb,var(--panel-strong)_72%,transparent)] opacity-75"
          : dragging
          ? "border-[var(--brand-accent)] bg-[var(--brand-accent-soft)]"
          : "border-[var(--panel-border)] bg-[color-mix(in_srgb,var(--panel-strong)_82%,transparent)] hover:border-[color-mix(in_srgb,var(--brand-accent)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--panel-strong)_95%,transparent)]"
      )}
    >
      <div className="relative z-[1] w-full">
        <div className="space-y-3">
          <span className="brand-badge inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
            {label}
          </span>
          <div className="pb-1">
            <h3 className="text-2xl font-semibold leading-tight text-slate-900 dark:text-white">
              <span>Drop CSV here or </span>
              <span className="text-[var(--brand-accent)]">click to upload</span>
            </h3>
          </div>
        </div>
      </div>
      <div className="relative z-[1] mt-4 w-full">
        <div className="brand-surface rounded-[1.7rem] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Upload Format</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">CSV file, first file only, validated against the airport reference set.</p>
            </div>
          </div>
          {templateLabel && onTemplateDownload ? (
            <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300">
              Download {templateLabel}{" "}
              <button
                type="button"
                onClick={onTemplateClick}
                className="brand-link font-semibold underline underline-offset-4 transition hover:opacity-80"
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
