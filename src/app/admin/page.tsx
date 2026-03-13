import Link from "next/link";

import { AdminAirports } from "@/components/admin-airports";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_45%,#fff7ed_100%)] px-4 py-8 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_45%,#1e293b_100%)] md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/10 dark:text-white">
            Back to app
          </Link>
        </div>
        <AdminAirports />
      </div>
    </main>
  );
}
