export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  accountType: 'USER' | 'BUSINESS'
}

export interface AuthResponse {
  token: string
  email: string
  fullName: string
  role: 'USER' | 'BUSINESS'
}

export interface User {
  email: string
  accountType: 'USER' | 'BUSINESS'
}
