// src/types/business.ts
export interface BusinessProfile {
  id: string
  userId: string
  businessName: string
  description: string | null
  address: string | null
  city: string | null
  phone: string | null
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
}

export type UpdateBusinessProfileRequest = CreateBusinessProfileRequest

export interface CreateProductRequest {
  name: string
  description?: string
  price: number
  imageUrl?: string
  available: boolean
}

export type UpdateProductRequest = CreateProductRequest
