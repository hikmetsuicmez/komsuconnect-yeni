'use client'

import { createContext, useCallback, useEffect, useState } from 'react'
import api from '@/lib/api'
import type { BusinessProfile } from '@/types/business'

interface BusinessContextValue {
  profile: BusinessProfile | null
  hasProfile: boolean
  isLoading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
}

export const BusinessContext = createContext<BusinessContextValue | null>(null)

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get<BusinessProfile>('/api/v1/businesses/me')
      setProfile(response.data)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 404) {
        setProfile(null)
      } else {
        setError('Profil yüklenirken bir hata oluştu.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return (
    <BusinessContext.Provider
      value={{
        profile,
        hasProfile: profile !== null,
        isLoading,
        error,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </BusinessContext.Provider>
  )
}
