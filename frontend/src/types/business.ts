// src/types/business.ts
export type BusinessCategory =
  | 'BAKERY'
  | 'BUTCHER'
  | 'GROCERY'
  | 'MARKET'
  | 'CAFE'
  | 'FLORIST'
  | 'HABERDASHER'
  | 'REPAIR'
  | 'OTHER'

export interface BusinessProfile {
  id: string
  userId: string
  businessName: string
  description: string | null
  address: string | null
  city: string | null
  phone: string | null
  category: BusinessCategory | null
  neighborhood: string | null
  workingHours: string | null
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  businessProfileId: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  available: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateBusinessProfileRequest {
  businessName: string
  description?: string
  address?: string
  city?: string
  phone?: string
  category?: BusinessCategory
  neighborhood?: string
  workingHours?: string
}

export type UpdateBusinessProfileRequest = CreateBusinessProfileRequest

export interface BusinessPublicSummary {
  id: string
  businessName: string
  description: string | null
  city: string | null
  productCount: number
  category: BusinessCategory | null
  neighborhood: string | null
}

export interface ProductPublic {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  available: boolean
}

export interface BusinessPublicDetail {
  id: string
  businessName: string
  description: string | null
  address: string | null
  city: string | null
  phone: string | null
  productCount: number
  products: ProductPublic[]
  category: BusinessCategory | null
  neighborhood: string | null
  workingHours: string | null
}
