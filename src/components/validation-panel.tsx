import { ParsedCsvResult } from "@/lib/types";

type ValidationPanelProps = {
  result?: ParsedCsvResult;
  title: string;
};

export function ValidationPanel({ result, title }: ValidationPanelProps) {
  return (
    <section className="rounded-[2rem] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Validation highlights, duplicate rollups, and unknown airport codes.</p>
      </div>
      {!result ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Upload a CSV to see validation details.</p>
      ) : (
        <div className="space-y-4 text-sm">
          <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-900/60">Raw rows: {result.rawRowCount}</div>
            <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-900/60">Valid rows: {result.validRowCount}</div>
            <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-900/60">Normalized rows: {result.normalizedRows.length}</div>
            <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-900/60">Duplicate groups: {result.duplicateGroups}</div>
            <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-900/60">Rows merged: {result.duplicateRowsMerged}</div>
            <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-900/60">Unknown IATA: {result.unknownIatas.length}</div>
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">Reference matches</p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              {result.matchedIatas.length} airport codes matched the built-in reference database and can be plotted on the map.
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">Issues</p>
            {result.issues.length === 0 ? (
              <p className="mt-1 text-slate-500 dark:text-slate-400">No structural validation issues found.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-slate-600 dark:text-slate-300">
                {result.issues.map((issue, index) => (
                  <li key={`${issue.rowNumber}-${index}`}>Row {issue.rowNumber}: {issue.message}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">Unknown IATA codes</p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              {result.unknownIatas.length === 0 ? "All IATA codes matched the airport reference data." : result.unknownIatas.join(", ")}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
