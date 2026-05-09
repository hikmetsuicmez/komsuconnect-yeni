import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import type { BusinessPublicSummary } from '@/types/business'

interface Props {
  business: BusinessPublicSummary
}

export default function BusinessCard({ business }: Props) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-heading text-xl font-bold text-foreground mb-1">
          {business.businessName}
        </h2>
        {business.description && (
          <p className="text-foreground/60 text-sm mb-3 line-clamp-2">
            {business.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-foreground/60 text-sm mb-4">
          {business.city && <span>{business.city}</span>}
          <span>{business.productCount} ürün</span>
        </div>
        <Link
          href={`/businesses/${business.id}`}
          className="inline-block bg-accent text-white text-sm px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
        >
          İncele
        </Link>
      </CardContent>
    </Card>
  )
}
