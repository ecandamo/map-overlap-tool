"use client";

import { useEffect, useId, useState } from "react";

import { CollapsiblePanel } from "@/components/collapsible-panel";
import { ParsedCsvResult } from "@/lib/types";

type ValidationPanelProps = {
  result?: ParsedCsvResult;
  title: string;
  compact?: boolean;
};

export function ValidationPanel({ result, title, compact = false }: ValidationPanelProps) {
  const issueCount = result?.issues.length ?? 0;
  const unknownCount = result?.unknownIatas.length ?? 0;
  const needsReview = issueCount > 0 || unknownCount > 0;
  const statusLabel = !result ? "No File" : needsReview ? "Needs Review" : "Looks Good";
  const statusTone = !result ? "neutral" : needsReview ? "warning" : "good";
  const [expanded, setExpanded] = useState(needsReview);
  const panelId = useId();
  const summaryParts = !result
    ? ["Upload a CSV to See Validation Details."]
    : needsReview
      ? [
          issueCount > 0 ? `${issueCount} Issue${issueCount === 1 ? "" : "s"}` : null,
          unknownCount > 0 ? `${unknownCount} Unknown IATA` : null
        ].filter(Boolean)
      : [`${result.matchedIatas.length} Reference Matches`, "No Issues"];

  useEffect(() => {
    setExpanded(needsReview);
  }, [needsReview, result?.fileName]);

  return (
    <div
      className={
        compact
          ? "rounded-[1.5rem] border border-black/10 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
          : "rounded-[2rem] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5"
      }
    >
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className={`flex w-full cursor-pointer justify-between gap-4 text-left ${compact ? "items-center" : "items-start"}`}
      >
        <div>
          <h3 className={`${compact ? "text-sm" : "text-lg"} font-semibold text-slate-950 dark:text-white`}>{title}</h3>
          <p className={`mt-1 ${compact ? "text-xs" : "text-sm"} text-slate-500 dark:text-slate-400`}>{summaryParts.join(" · ")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              statusTone === "warning"
                ? "rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
                : statusTone === "good"
                  ? "rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
                  : "rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }
          >
            {statusLabel}
          </span>
          <span aria-hidden="true" className={`text-xs text-slate-500 transition ${expanded ? "rotate-180" : ""}`}>⌃</span>
        </div>
      </button>
      <CollapsiblePanel expanded={expanded} className="mt-3" id={panelId}>
        <div className={`space-y-4 ${compact ? "text-xs" : "text-sm"}`}>
          {!result ? (
            <p className="text-slate-500 dark:text-slate-400">Upload a CSV to See Validation Details.</p>
          ) : (
            <>
              <div className={`rounded-2xl bg-slate-100/80 text-slate-600 dark:bg-slate-900/60 dark:text-slate-300 ${compact ? "p-2.5" : "p-3"}`}>
                {result.fileName} Loaded with {result.normalizedRows.length} Unique Airports.
              </div>
              {needsReview ? (
                <>
                  {issueCount > 0 ? (
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Issues</p>
                      <ul className="mt-2 space-y-2 text-slate-600 dark:text-slate-300">
                        {result.issues.map((issue, index) => (
                          <li key={`${issue.rowNumber}-${index}`}>Row {issue.rowNumber}: {issue.message}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {unknownCount > 0 ? (
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Unknown IATA Codes</p>
                      <p className="mt-1 text-slate-500 dark:text-slate-400">{result.unknownIatas.join(", ")}</p>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No Structural Issues or Unknown IATA Codes Found.</p>
              )}
            </>
          )}
        </div>
      </CollapsiblePanel>
    </div>
  );
}
