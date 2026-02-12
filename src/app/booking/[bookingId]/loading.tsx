export default function BookingLoading() {
  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6 animate-pulse">
        <div className="text-center">
          <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-zinc-800 mx-auto mb-4" />
          <div className="h-7 w-48 bg-gray-200 dark:bg-zinc-800 rounded-lg mx-auto" />
          <div className="h-4 w-32 bg-gray-100 dark:bg-zinc-800/50 rounded mt-2 mx-auto" />
        </div>
        <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 p-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-6 bg-gray-100 dark:bg-zinc-800/50 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
