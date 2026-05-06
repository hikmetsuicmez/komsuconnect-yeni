import { create } from 'zustand'
import type { User } from '@/types/auth'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

// Sprint 2: Sayfa yenileme sonrası oturum kalıcılığı için
// ya persist middleware (user bilgisi, token hariç) ya da /api/v1/auth/me endpoint'i eklenecek.
export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  login: (token, user) => set({ token, user, isAuthenticated: true }),
  logout: () => set({ token: null, user: null, isAuthenticated: false }),
}))
