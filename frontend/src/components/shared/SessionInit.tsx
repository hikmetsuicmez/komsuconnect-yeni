'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import type { AuthResponse } from '@/types/auth'

export default function SessionInit() {
  const login = useAuthStore((state) => state.login)
  const setSessionChecked = useAuthStore((state) => state.setSessionChecked)

  useEffect(() => {
    api
      .post<AuthResponse>('/api/v1/auth/me')
      .then((res) => {
        login(res.data.token, { email: res.data.email, accountType: res.data.role })
      })
      .catch(() => {
        // No valid cookie — user is not authenticated, that's fine
      })
      .finally(() => {
        setSessionChecked(true)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
