export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 space-y-3">
        <div className="h-9 bg-muted rounded animate-pulse w-64" />
        <div className="h-4 bg-muted rounded animate-pulse w-full max-w-lg" />
        <div className="h-4 bg-muted rounded animate-pulse w-48" />
      </div>
      <div className="h-6 bg-muted rounded animate-pulse w-32 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-surface border border-muted overflow-hidden"
          >
            <div className="h-40 bg-muted animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
              <div className="h-4 bg-muted rounded animate-pulse w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
