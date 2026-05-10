import type { Metadata } from 'next'
import Link from 'next/link'
import { getBusinessById } from '@/lib/businessApi'
import ProductCard from '@/components/businesses/ProductCard'

export const revalidate = 30

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  try {
    const { id } = await params
    const business = await getBusinessById(id)
    return {
      title: `${business.businessName} — KomsuConnect`,
      description: business.description ?? `${business.businessName} ürünlerini keşfet`,
    }
  } catch {
    return { title: 'Esnaf — KomsuConnect' }
  }
}

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const business = await getBusinessById(id)

  return (
    <div>
      {/* Geri link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link href="/" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
          ← Ana sayfa
        </Link>
      </div>

      {/* Hero banner — gradient placeholder, gerçek kapak görseli yok */}
      <div className="relative w-full h-48 bg-gradient-to-br from-[#D4A340] via-[#C2492C]/80 to-[#26201A] flex items-end mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 w-full">
          <h1 className="font-heading text-4xl text-white">
            {business.businessName}
          </h1>
        </div>
      </div>

      {/* İçerik */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Esnaf detay kartı */}
        <div className="bg-surface border border-muted shadow-[3px_3px_0_#26201A] p-6 mb-8">
          {business.description && (
            <p className="text-foreground/70 mb-4">{business.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
            {business.city && <span>📍 {business.city}</span>}
            {business.address && <span>{business.address}</span>}
            {business.phone && (
              <a href={`tel:${business.phone}`} className="hover:text-accent transition-colors">
                📞 {business.phone}
              </a>
            )}
          </div>
        </div>

        {/* Ürünler */}
        <h2 className="font-heading text-2xl text-muted mb-6">
          Ürünler ({business.productCount})
        </h2>

        {business.products.length === 0 ? (
          <p className="text-foreground/60">Bu esnaf henüz ürün eklememiş.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {business.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
