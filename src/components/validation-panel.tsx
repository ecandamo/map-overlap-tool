import { ParsedCsvResult } from "@/lib/types";

type ValidationPanelProps = {
  result?: ParsedCsvResult;
  title: string;
  embedded?: boolean;
};

export function ValidationPanel({ result, title, embedded = false }: ValidationPanelProps) {
  const issueCount = result?.issues.length ?? 0;
  const unknownCount = result?.unknownIatas.length ?? 0;
  const needsReview = issueCount > 0 || unknownCount > 0;
  const statusLabel = !result ? "No File" : needsReview ? "Needs Review" : "Looks Good";
  const summaryParts = !result
    ? ["Upload a CSV to See Validation Details."]
    : needsReview
      ? [
          issueCount > 0 ? `${issueCount} Issue${issueCount === 1 ? "" : "s"}` : null,
          unknownCount > 0 ? `${unknownCount} Unknown IATA` : null
        ].filter(Boolean)
      : [`${result.matchedIatas.length} Reference Matches`, "No Issues"];

  return (
    <details
      open={needsReview}
      className={
        embedded
          ? "rounded-[1.5rem] border border-black/5 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-slate-950/40"
          : "rounded-[2rem] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5"
      }
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{summaryParts.join(" · ")}</p>
        </div>
        <span
          className={
            needsReview
              ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
              : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }
        >
          {statusLabel}
        </span>
      </summary>
      <div className="mt-4 space-y-4 text-sm">
        {!result ? (
          <p className="text-slate-500 dark:text-slate-400">Upload a CSV to See Validation Details.</p>
        ) : needsReview ? (
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
      </div>
    </details>
  );
}
