import Link from "next/link";

import { AdminAirports } from "@/components/admin-airports";

export default function AdminPage() {
  return (
    <main className="app-shell min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <div />
          <Link href="/" className="brand-btn-secondary rounded-full px-4 py-2 text-sm font-medium dark:text-white">
            Back to app
          </Link>
        </div>
        <AdminAirports />
      </div>
    </main>
  );
}
