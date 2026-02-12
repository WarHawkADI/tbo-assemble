"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, AlertTriangle, ArrowLeft } from "lucide-react";

export default function CalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Calendar error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center max-w-md">
        <div className="h-14 w-14 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-2">Calendar Error</h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
          Could not load calendar data. Please try again.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#e55a2b] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
