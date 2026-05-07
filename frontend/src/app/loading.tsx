export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center space-y-3">
        <div className="h-10 bg-muted rounded animate-pulse w-96 mx-auto" />
        <div className="h-5 bg-muted rounded animate-pulse w-64 mx-auto" />
      </div>
      <div className="h-10 bg-muted rounded animate-pulse w-48 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-surface border border-muted p-6 space-y-3"
          >
            <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-full" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            <div className="h-8 bg-muted rounded animate-pulse w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
