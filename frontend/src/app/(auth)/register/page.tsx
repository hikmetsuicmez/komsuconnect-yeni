'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import type { AuthResponse } from '@/types/auth'

const registerSchema = z.object({
  firstName:   z.string().min(2, { message: 'Ad en az 2 karakter olmalıdır' }),
  lastName:    z.string().min(2, { message: 'Soyad en az 2 karakter olmalıdır' }),
  email:       z.string().email({ message: 'Geçerli bir e-posta adresi girin' }),
  password:    z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır' }),
  accountType: z.enum(['USER', 'BUSINESS']),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
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
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { accountType: 'USER' },
  })

  const accountType = watch('accountType')

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null)
    try {
      const payload = {
        fullName: `${data.firstName} ${data.lastName}`.trim(),
        email:    data.email,
        password: data.password,
        role:     data.accountType,
      }
      const response = await api.post<AuthResponse>('/api/v1/auth/register', payload)
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
        if (status === 409) {
          setServerError('Bu e-posta adresi zaten kayıtlı.')
        } else if (status === 400) {
          setServerError('Girilen bilgiler geçersiz. Lütfen kontrol edin.')
        } else {
          setServerError('Bir hata oluştu. Lütfen tekrar deneyin.')
        }
      } else {
        setServerError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.')
      }
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sol panel */}
      <div className="hidden md:flex flex-col justify-center px-12 bg-primary w-1/2">
        <div className="mb-6 flex items-baseline gap-0.5">
          <span className="font-logo text-2xl text-surface">Komşu</span>
          <span className="font-heading text-2xl text-accent">Connect</span>
        </div>
        <h2 className="font-heading text-4xl text-surface leading-tight mb-4">
          MAHALLE<br />ESNAFINA<br />KATIL.
        </h2>
        <p className="text-surface/60 text-sm leading-relaxed max-w-xs">
          Dükkanını dijitale taşı, mahallenin müşterilerine ulaş.
        </p>
      </div>

      {/* Sağ panel */}
      <div className="flex flex-col justify-center px-8 sm:px-12 w-full md:w-1/2 bg-[#F5EAD4] overflow-y-auto py-12">
        <div className="w-full max-w-sm mx-auto">
          <h1 className="font-heading text-2xl text-foreground mb-1">Hesap oluştur</h1>
          <p className="text-foreground/60 text-sm mb-8">Mahalle esnafına katıl</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Hesap Tipi */}
            <div className="space-y-2">
              <Label>Hesap Tipi</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('accountType', 'USER')}
                  className={cn(
                    'flex flex-col items-center gap-2 border p-4 text-sm transition-colors',
                    accountType === 'USER'
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-muted bg-surface text-foreground/60 hover:border-foreground/30'
                  )}
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Bireysel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('accountType', 'BUSINESS')}
                  className={cn(
                    'flex flex-col items-center gap-2 border p-4 text-sm transition-colors',
                    accountType === 'BUSINESS'
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-muted bg-surface text-foreground/60 hover:border-foreground/30'
                  )}
                >
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">Esnaf</span>
                </button>
              </div>
            </div>

            {/* Ad Soyad */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ad</Label>
                <Input id="firstName" placeholder="Ahmet" {...register('firstName')} />
                {errors.firstName && <p className="text-xs text-accent">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Soyad</Label>
                <Input id="lastName" placeholder="Yılmaz" {...register('lastName')} />
                {errors.lastName && <p className="text-xs text-accent">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* E-posta */}
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <Input id="email" type="email" placeholder="ornek@mail.com" className="pl-10" {...register('email')} />
              </div>
              {errors.email && <p className="text-xs text-accent">{errors.email.message}</p>}
            </div>

            {/* Şifre */}
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
              {isSubmitting ? 'Kaydediliyor…' : 'Kayıt Ol'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/60">
            Zaten hesabın var mı?{' '}
            <Link href="/login" className="text-accent hover:underline">Giriş yap</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
