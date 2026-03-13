export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_45%,#fff7ed_100%)] px-6 text-center dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_45%,#1e293b_100%)]">
      <div className="rounded-[2rem] border border-black/10 bg-white/80 p-10 dark:border-white/10 dark:bg-white/5">
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Page not found</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">The page you requested does not exist in this local MVP.</p>
      </div>
    </main>
  );
}
