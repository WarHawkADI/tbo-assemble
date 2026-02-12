export default function CalendarLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-28 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
        <div className="h-4 w-48 bg-gray-100 dark:bg-zinc-800/50 rounded mt-2" />
      </div>
      <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 h-96" />
    </div>
  );
}
