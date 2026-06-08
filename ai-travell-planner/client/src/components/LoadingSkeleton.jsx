export default function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-20 animate-pulse rounded bg-slate-200" />
      ))}
    </div>
  );
}
