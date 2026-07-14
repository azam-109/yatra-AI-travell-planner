export default function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="premium-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="h-4 w-44 animate-shimmer rounded-full bg-white/10" />
          <div className="h-7 w-20 animate-shimmer rounded-full bg-white/10" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="h-3 w-24 animate-shimmer rounded-full bg-white/10" />
              <div className="mt-3 h-5 w-28 animate-shimmer rounded-full bg-white/10" />
              <div className="mt-4 h-2 animate-shimmer rounded-full bg-white/10" />
              <div className="mt-2 h-2 w-3/4 animate-shimmer rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      <div className="premium-card p-5">
        <div className="mb-4 h-4 w-36 animate-shimmer rounded-full bg-white/10" />
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-shimmer rounded-2xl bg-white/10" />
                <div className="flex-1">
                  <div className="h-4 w-32 animate-shimmer rounded-full bg-white/10" />
                  <div className="mt-2 h-3 w-52 animate-shimmer rounded-full bg-white/10" />
                </div>
                <div className="h-8 w-20 animate-shimmer rounded-full bg-white/10" />
              </div>
              <div className="mt-4 h-2 animate-shimmer rounded-full bg-white/10" />
              <div className="mt-2 h-2 w-5/6 animate-shimmer rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
