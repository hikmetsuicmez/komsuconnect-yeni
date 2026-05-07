import { notFound } from 'next/navigation'
import type {
  BusinessPublicSummary,
  BusinessPublicDetail,
} from '@/types/business'

const BASE = process.env.NEXT_PUBLIC_API_URL
if (!BASE) throw new Error('NEXT_PUBLIC_API_URL is not set')

export async function getBusinesses(
  city?: string
): Promise<BusinessPublicSummary[]> {
  const url = city
    ? `${BASE}/api/v1/businesses?city=${encodeURIComponent(city)}`
    : `${BASE}/api/v1/businesses`
  try {
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getCities(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}/api/v1/businesses/cities`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getBusinessById(
  id: string
): Promise<BusinessPublicDetail> {
  let res: Response
  try {
    res = await fetch(`${BASE}/api/v1/businesses/${id}`, {
      next: { revalidate: 30 },
    })
  } catch (err) {
    throw new Error(`Failed to fetch business ${id}`, { cause: err })
  }
  if (res.status === 404) notFound()
  if (!res.ok) throw new Error(`Unexpected status ${res.status} for business ${id}`)
  return res.json()
}
