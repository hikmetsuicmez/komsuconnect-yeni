import {
  Wheat,
  Beef,
  ShoppingBasket,
  Store,
  Coffee,
  Flower,
  Scissors,
  Wrench,
  Grid3x3,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { BusinessCategory } from '@/types/business'

export const CATEGORIES: {
  value: BusinessCategory
  label: string
  Icon: LucideIcon
}[] = [
  { value: 'BAKERY',      label: 'Fırın',    Icon: Wheat },
  { value: 'BUTCHER',     label: 'Kasap',    Icon: Beef },
  { value: 'GROCERY',     label: 'Manav',    Icon: ShoppingBasket },
  { value: 'MARKET',      label: 'Bakkal',   Icon: Store },
  { value: 'CAFE',        label: 'Kahveci',  Icon: Coffee },
  { value: 'FLORIST',     label: 'Çiçekçi',  Icon: Flower },
  { value: 'HABERDASHER', label: 'Tuhafiye', Icon: Scissors },
  { value: 'REPAIR',      label: 'Tamirci',  Icon: Wrench },
  { value: 'OTHER',       label: 'Diğer',    Icon: Grid3x3 },
]

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  BAKERY:      'Fırın',
  BUTCHER:     'Kasap',
  GROCERY:     'Manav',
  MARKET:      'Bakkal',
  CAFE:        'Kahveci',
  FLORIST:     'Çiçekçi',
  HABERDASHER: 'Tuhafiye',
  REPAIR:      'Tamirci',
  OTHER:       'Diğer',
}
