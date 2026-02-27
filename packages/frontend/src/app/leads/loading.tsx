export default function LeadsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="h-8 w-48 bg-gravity-surface rounded animate-shimmer shimmer-bg mb-6" />
      <div className="space-y-1">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="h-14 bg-gravity-surface rounded-lg animate-shimmer shimmer-bg" style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
    </div>
  );
}
