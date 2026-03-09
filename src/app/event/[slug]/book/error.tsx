"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function BookingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Booking page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-zinc-950 dark:to-zinc-900 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Unable to Load Booking Page
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            We encountered an error while loading the booking page. Please try again.
          </p>
        </div>

        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#ff6b35] to-[#e55a2b] text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>

        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
