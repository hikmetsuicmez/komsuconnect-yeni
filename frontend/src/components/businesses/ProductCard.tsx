import Image from 'next/image'
import type { ProductPublic } from '@/types/business'

interface Props {
  product: ProductPublic
}

export default function ProductCard({ product }: Props) {
  return (
    <div
      className={`rounded-xl border border-muted bg-surface overflow-hidden${
        !product.available ? ' opacity-50' : ''
      }`}
    >
      <div className="relative h-40 bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-foreground/30 text-xs">Görsel yok</span>
          </div>
        )}
        {!product.available && (
          <span className="absolute top-2 right-2 bg-primary/80 text-foreground/60 text-xs px-2 py-1 rounded">
            Tükendi
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading font-semibold text-foreground mb-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-foreground/60 text-sm mb-2 line-clamp-2">
            {product.description}
          </p>
        )}
        <span className="text-accent font-bold text-sm">
          ₺{Number(product.price).toFixed(2)}
        </span>
      </div>
    </div>
  )
}
