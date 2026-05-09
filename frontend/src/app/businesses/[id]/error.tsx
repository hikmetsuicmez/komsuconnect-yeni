'use client'

import Link from 'next/link'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-3">
        Esnaf bulunamadı
      </h2>
      <p className="text-foreground/60 mb-6">
        Bu esnaf mevcut değil ya da yüklenirken bir hata oluştu.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent/90 transition-colors"
        >
          Ana Sayfaya Dön
        </Link>
        <button
          onClick={reset}
          className="border border-muted text-foreground/70 px-6 py-2 rounded-lg hover:border-accent hover:text-foreground transition-colors"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  )
}
