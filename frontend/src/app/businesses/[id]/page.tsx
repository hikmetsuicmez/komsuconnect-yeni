import type { Metadata } from 'next'
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
      description:
        business.description ?? `${business.businessName} ürünlerini keşfet`,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
          {business.businessName}
        </h1>
        {business.description && (
          <p className="text-foreground/70 mb-4">{business.description}</p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
          {business.city && <span>📍 {business.city}</span>}
          {business.address && <span>{business.address}</span>}
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="hover:text-accent transition-colors"
            >
              📞 {business.phone}
            </a>
          )}
        </div>
      </div>

      <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
        Ürünler ({business.productCount})
      </h2>

      {business.products.length === 0 ? (
        <p className="text-foreground/60">
          Bu esnaf henüz ürün eklememiş.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {business.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
