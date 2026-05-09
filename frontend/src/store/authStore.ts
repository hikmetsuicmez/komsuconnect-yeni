import { create } from 'zustand'
import type { User } from '@/types/auth'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  _sessionChecked: boolean
  login: (token: string, user: User) => void
  logout: () => void
  setSessionChecked: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  _sessionChecked: false,
  login: (token, user) => set({ token, user, isAuthenticated: true }),
  logout: () => set({ token: null, user: null, isAuthenticated: false }),
  setSessionChecked: (value) => set({ _sessionChecked: value }),
}))
