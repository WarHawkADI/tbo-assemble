export default function EventLoading() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950">
      {/* Hero skeleton */}
      <div className="relative min-h-[60vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-white dark:from-zinc-900 dark:to-zinc-950" />
        <div className="relative z-10 text-center space-y-4 px-6">
          <div className="skeleton-shimmer h-8 w-48 rounded-full mx-auto" />
          <div className="skeleton-shimmer h-12 w-80 rounded-lg mx-auto" />
          <div className="skeleton-shimmer h-5 w-64 rounded-lg mx-auto" />
          <div className="skeleton-shimmer h-5 w-40 rounded-lg mx-auto" />
          <div className="skeleton-shimmer h-12 w-48 rounded-xl mx-auto mt-6" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="max-w-5xl mx-auto px-6 -mt-12">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-8 grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-2">
              <div className="skeleton-shimmer h-10 w-16 rounded-lg mx-auto" />
              <div className="skeleton-shimmer h-4 w-24 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Room cards skeleton */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center space-y-2 mb-8">
          <div className="skeleton-shimmer h-8 w-48 rounded-lg mx-auto" />
          <div className="skeleton-shimmer h-4 w-64 rounded mx-auto" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-700 p-6 space-y-3">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="skeleton-shimmer h-5 w-32 rounded" />
                  <div className="skeleton-shimmer h-3 w-24 rounded" />
                </div>
                <div className="skeleton-shimmer h-8 w-20 rounded" />
              </div>
              <div className="skeleton-shimmer h-1.5 w-full rounded-full" />
              <div className="skeleton-shimmer h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
