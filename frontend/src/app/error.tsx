'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-3">
        Bir şeyler yanlış gitti
      </h2>
      <p className="text-foreground/60 mb-6">
        Sayfa yüklenirken bir hata oluştu.
      </p>
      <button
        onClick={reset}
        className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent/90 transition-colors"
      >
        Yenile
      </button>
    </div>
  )
}
