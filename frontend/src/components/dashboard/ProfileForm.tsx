// src/components/dashboard/ProfileForm.tsx
'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import { useBusiness } from '@/hooks/useBusiness'
import { CATEGORIES } from '@/constants/categories'
import type { BusinessProfile } from '@/types/business'

const CATEGORY_VALUES = [
  'BAKERY', 'BUTCHER', 'GROCERY', 'MARKET', 'CAFE',
  'FLORIST', 'HABERDASHER', 'REPAIR', 'OTHER',
] as const

const profileSchema = z.object({
  businessName: z.string().min(1, 'İşletme adı zorunludur'),
  description: z.string().optional(),
  address: z.string().max(255, 'Adres en fazla 255 karakter olabilir').optional(),
  city: z.string().max(100, 'Şehir adı en fazla 100 karakter olabilir').optional(),
  phone: z
    .string()
    .refine((val) => val === '' || (val.length >= 7 && val.length <= 20), {
      message: 'Telefon 7-20 karakter arasında olmalıdır',
    })
    .optional(),
  category: z.enum(CATEGORY_VALUES).optional(),
  neighborhood: z.string().max(100, 'Mahalle en fazla 100 karakter olabilir').optional(),
  workingHours: z.string().max(100, 'Çalışma saatleri en fazla 100 karakter olabilir').optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  profile: BusinessProfile | null
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const { refreshProfile } = useBusiness()
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: profile?.businessName ?? '',
      description: profile?.description ?? '',
      address: profile?.address ?? '',
      city: profile?.city ?? '',
      phone: profile?.phone ?? '',
      category: profile?.category ?? undefined,
      neighborhood: profile?.neighborhood ?? '',
      workingHours: profile?.workingHours ?? '',
    },
  })

  useEffect(() => {
    reset({
      businessName: profile?.businessName ?? '',
      description: profile?.description ?? '',
      address: profile?.address ?? '',
      city: profile?.city ?? '',
      phone: profile?.phone ?? '',
      category: profile?.category ?? undefined,
      neighborhood: profile?.neighborhood ?? '',
      workingHours: profile?.workingHours ?? '',
    })
  }, [profile, reset])

  const onSubmit = async (data: ProfileFormData) => {
    setServerError(null)
    setSuccessMessage(null)
    const payload = {
      businessName: data.businessName,
      ...(data.description && { description: data.description }),
      ...(data.address && { address: data.address }),
      ...(data.city && { city: data.city }),
      ...(data.phone && { phone: data.phone }),
      ...(data.category && { category: data.category }),
      ...(data.neighborhood && { neighborhood: data.neighborhood }),
      ...(data.workingHours && { workingHours: data.workingHours }),
    }
    try {
      if (profile) {
        await api.put(`/api/v1/businesses/${profile.id}`, payload)
      } else {
        await api.post('/api/v1/businesses', payload)
      }
      await refreshProfile()
      setSuccessMessage('Profil başarıyla kaydedildi.')
    } catch {
      setServerError('Profil kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="businessName">İşletme Adı *</Label>
        <Input
          id="businessName"
          {...register('businessName')}
          placeholder="Örn: Ahmet'in Fırını"
        />
        {errors.businessName && (
          <p className="text-xs text-accent">{errors.businessName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <textarea
          id="description"
          {...register('description')}
          placeholder="İşletmenizi kısaca tanıtın"
          rows={3}
          className="w-full rounded-lg border border-muted bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Adres</Label>
        <Input
          id="address"
          {...register('address')}
          placeholder="Sokak, Mahalle, No"
        />
        {errors.address && (
          <p className="text-xs text-accent">{errors.address.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Şehir</Label>
        <Input id="city" {...register('city')} placeholder="İstanbul" />
        {errors.city && (
          <p className="text-xs text-accent">{errors.city.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Kategori</Label>
        <select
          id="category"
          {...register('category')}
          className="w-full rounded-lg border border-muted bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">— Seçiniz —</option>
          {CATEGORIES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-xs text-accent">{errors.category.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="neighborhood">Mahalle</Label>
        <Input
          id="neighborhood"
          {...register('neighborhood')}
          placeholder="Kadıköy, Moda"
        />
        {errors.neighborhood && (
          <p className="text-xs text-accent">{errors.neighborhood.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="workingHours">Çalışma Saatleri</Label>
        <Input
          id="workingHours"
          {...register('workingHours')}
          placeholder="09:00-18:00"
        />
        {errors.workingHours && (
          <p className="text-xs text-accent">{errors.workingHours.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input
          id="phone"
          {...register('phone')}
          placeholder="05XX XXX XX XX"
        />
        {errors.phone && (
          <p className="text-xs text-accent">{errors.phone.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-accent">{serverError}</p>}
      {successMessage && <p className="text-sm text-green-400">{successMessage}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Kaydediliyor…' : profile ? 'Güncelle' : 'Profil Oluştur'}
      </Button>
    </form>
  )
}
