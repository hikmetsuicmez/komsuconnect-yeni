'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import type { AuthResponse } from '@/types/auth'

const loginSchema = z.object({
  email:    z.string().email({ message: 'Geçerli bir e-posta adresi girin' }),
  password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır' }),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) router.replace('/')
  }, [isAuthenticated, router])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null)
    try {
      const response = await api.post<AuthResponse>('/api/v1/auth/login', data)
      const { token, role } = response.data
      login(token, { email: data.email, accountType: role })
      router.push(role === 'BUSINESS' ? '/dashboard' : '/')
    } catch (error: unknown) {
      if (
        typeof error === 'object' && error !== null &&
        'response' in error &&
        typeof (error as { response?: { status?: number } }).response?.status === 'number'
      ) {
        const status = (error as { response: { status: number } }).response.status
        setServerError(
          status === 401 || status === 400
            ? 'E-posta veya şifre hatalı.'
            : 'Bir hata oluştu. Lütfen tekrar deneyin.'
        )
      } else {
        setServerError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.')
      }
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sol panel — md ve üzeri */}
      <div className="hidden md:flex flex-col justify-center px-12 bg-primary w-1/2">
        <div className="mb-6 flex items-baseline gap-0.5">
          <span className="font-logo text-2xl text-surface">Komşu</span>
          <span className="font-heading text-2xl text-accent">Connect</span>
        </div>
        <h2 className="font-heading text-4xl text-surface leading-tight mb-4">
          HOŞ GELDİN.<br />MAHALLENE.
        </h2>
        <p className="text-surface/60 text-sm leading-relaxed max-w-xs">
          Sokağındaki manav, fırın, kasap, çiçekçi — hepsi bir tıkla.
          KomşuConnect, mahalle dokusunu dijitalde yaşatır.
        </p>
      </div>

      {/* Sağ panel */}
      <div className="flex flex-col justify-center px-8 sm:px-12 w-full md:w-1/2 bg-[#F5EAD4]">
        <div className="w-full max-w-sm mx-auto">
          <h1 className="font-heading text-2xl text-foreground mb-1">Tekrar hoş geldin</h1>
          <p className="text-foreground/60 text-sm mb-8">Hesabına giriş yap</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@mail.com"
                  className="pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-accent">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-accent">{errors.password.message}</p>}
            </div>

            {serverError && <p className="text-sm text-accent text-center">{serverError}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/60">
            Hesabın yok mu?{' '}
            <Link href="/register" className="text-accent hover:underline">Kayıt ol</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
