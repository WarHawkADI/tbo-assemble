export default function OnboardingLoading() {
  return (
    <div className="space-y-8 animate-pulse max-w-3xl mx-auto">
      <div className="text-center">
        <div className="h-8 w-48 bg-gray-200 dark:bg-zinc-800 rounded-lg mx-auto" />
        <div className="h-4 w-64 bg-gray-100 dark:bg-zinc-800/50 rounded mt-3 mx-auto" />
      </div>
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-10 rounded-full bg-gray-200 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 p-8 space-y-6">
        <div className="h-5 w-40 bg-gray-200 dark:bg-zinc-800 rounded" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-zinc-800/50 rounded-xl" />
          ))}
        </div>
        <div className="h-12 w-full bg-gray-200 dark:bg-zinc-800 rounded-xl" />
      </div>
    </div>
  );
}
