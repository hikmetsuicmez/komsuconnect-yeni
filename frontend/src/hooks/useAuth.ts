import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

export function useAuth() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const login = useAuthStore((state) => state.login)
  const storeLogout = useAuthStore((state) => state.logout)

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout')
    } catch {
      // Clear local state regardless of server response
    }
    storeLogout()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  return { token, user, isAuthenticated, login, logout }
}
