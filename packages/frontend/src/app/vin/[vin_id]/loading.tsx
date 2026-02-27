export default function VinLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="h-6 w-32 bg-gravity-surface rounded animate-shimmer shimmer-bg mb-6" />
      <div className="h-64 bg-gravity-surface rounded-xl animate-shimmer shimmer-bg mb-8" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-72 bg-gravity-surface rounded-xl animate-shimmer shimmer-bg" />
        <div className="h-72 bg-gravity-surface rounded-xl animate-shimmer shimmer-bg" />
      </div>
    </div>
  );
}
