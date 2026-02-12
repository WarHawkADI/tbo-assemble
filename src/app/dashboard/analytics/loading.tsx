export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-32 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-56 bg-gray-100 dark:bg-zinc-800/50 rounded mt-2" />
        </div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 p-4 h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 h-80" />
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 h-80" />
      </div>
    </div>
  );
}
