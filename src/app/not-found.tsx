"use client";

import Link from "next/link";
import { Home, ArrowLeft, Search, Hotel } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-zinc-950 flex items-center justify-center p-6">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-orange-200/20 dark:bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/15 dark:bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="text-center max-w-md">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-[120px] sm:text-[160px] font-black text-gray-100 dark:text-zinc-800 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#ff6b35] to-[#e55a2b] flex items-center justify-center shadow-xl shadow-orange-500/20 animate-bounce" style={{ animationDuration: "2s" }}>
              <Hotel className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-3">
          Room Not Found
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-8 leading-relaxed">
          Looks like this page checked out early. The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#e55a2b] text-white font-semibold text-sm shadow-lg shadow-orange-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <Home className="h-4 w-4" /> Go Home
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 font-semibold text-sm hover:border-gray-300 dark:hover:border-zinc-600 transition-all"
          >
            <Search className="h-4 w-4" /> Dashboard
          </Link>
        </div>

        <p className="mt-8 text-xs text-gray-400 dark:text-zinc-600">
          TBO Assemble · The Operating System for Group Travel
        </p>
      </div>
    </div>
  );
}
