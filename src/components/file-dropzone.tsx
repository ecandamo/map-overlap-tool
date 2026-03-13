"use client";

import { ChangeEvent, DragEvent, KeyboardEvent, MouseEvent, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type FileDropzoneProps = {
  label: string;
  description: string;
  onFileSelect: (file: File) => void;
  statusText?: string;
  templateLabel?: string;
  onTemplateDownload?: () => void;
};

export function FileDropzone({ label, description, onFileSelect, statusText, templateLabel, onTemplateDownload }: FileDropzoneProps) {
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

  function openPicker() {
    inputRef.current?.click();
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
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
      tabIndex={0}
      onClick={openPicker}
      onKeyDown={onKeyDown}
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
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Drop CSV Here or Click to Upload</h3>
          <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">{description}</p>
          {templateLabel && onTemplateDownload ? (
            <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
              Download the {templateLabel}{" "}
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
      <div className="text-sm text-slate-500 dark:text-slate-400">{statusText ?? "CSV Only. Duplicate IATA Rows Are Combined Automatically."}</div>
      <input ref={inputRef} hidden type="file" accept=".csv,text/csv" onChange={onChange} />
    </div>
  );
}
