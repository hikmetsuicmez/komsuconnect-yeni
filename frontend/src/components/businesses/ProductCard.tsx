import Image from 'next/image'
import type { ProductPublic } from '@/types/business'

interface Props {
  product: ProductPublic
}

export default function ProductCard({ product }: Props) {
  return (
    <div
      className={`border border-muted bg-surface shadow-[3px_3px_0_#26201A] overflow-hidden${
        !product.available ? ' opacity-50' : ''
      }`}
    >
      <div className="relative h-40 bg-muted/20">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-foreground/30 text-xs">Görsel yok</span>
          </div>
        )}
        {!product.available && (
          <span className="absolute top-2 right-2 bg-primary/80 text-surface text-xs px-2 py-1">
            Tükendi
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading text-foreground mb-1">{product.name}</h3>
        {product.description && (
          <p className="text-foreground/60 text-sm mb-2 line-clamp-2">{product.description}</p>
        )}
        <span className="text-muted font-bold text-sm">₺{Number(product.price).toFixed(2)}</span>
      </div>
    </div>
  )
}
