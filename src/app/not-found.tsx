export default function NotFoundPage() {
  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-6 text-center">
      <div className="panel-strong rounded-[2rem] p-10">
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-white">Page not found</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">The page you requested does not exist in this local MVP.</p>
      </div>
    </main>
  );
}
