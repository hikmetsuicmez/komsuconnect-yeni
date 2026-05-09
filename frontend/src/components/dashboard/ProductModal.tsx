'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import type { Product } from '@/types/business'

const productSchema = z.object({
  name: z.string().min(1, 'Ürün adı zorunludur'),
  description: z.string().optional(),
  price: z
    .string()
    .min(1, 'Fiyat zorunludur')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Fiyat 0'dan büyük olmalıdır",
    }),
  available: z.boolean(),
  imageUrl: z
    .string()
    .url('Geçerli bir URL giriniz')
    .or(z.literal(''))
    .optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductModalProps {
  businessId: string
  product?: Product
  onClose: () => void
  onSuccess: () => void
}

export default function ProductModal({
  businessId,
  product,
  onClose,
  onSuccess,
}: ProductModalProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product?.price?.toString() ?? '',
      available: product?.available ?? true,
      imageUrl: product?.imageUrl ?? '',
    },
  })

  useEffect(() => {
    reset({
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product?.price?.toString() ?? '',
      available: product?.available ?? true,
      imageUrl: product?.imageUrl ?? '',
    })
  }, [product, reset])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const onSubmit = async (data: ProductFormData) => {
    setServerError(null)
    const payload = {
      name: data.name,
      ...(data.description && { description: data.description }),
      price: parseFloat(data.price),
      available: data.available,
      ...(data.imageUrl && { imageUrl: data.imageUrl }),
    }
    try {
      if (product) {
        await api.put(
          `/api/v1/businesses/${businessId}/products/${product.id}`,
          payload
        )
      } else {
        await api.post(`/api/v1/businesses/${businessId}/products`, payload)
      }
      onSuccess()
    } catch {
      setServerError('Ürün kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-surface border border-muted rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-bold">
            {product ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground/40 hover:text-foreground transition-colors"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prod-name">Ürün Adı *</Label>
            <Input
              id="prod-name"
              {...register('name')}
              placeholder="Örn: Tam Buğday Ekmeği"
            />
            {errors.name && (
              <p className="text-xs text-accent">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prod-description">Açıklama</Label>
            <textarea
              id="prod-description"
              {...register('description')}
              placeholder="Ürün hakkında kısa bilgi"
              rows={2}
              className="w-full rounded-lg border border-muted bg-primary px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prod-price">Fiyat (₺) *</Label>
            <Input
              id="prod-price"
              type="number"
              step="0.01"
              min="0.01"
              {...register('price')}
              placeholder="0.00"
            />
            {errors.price && (
              <p className="text-xs text-accent">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prod-image-url">Görsel URL&apos;si</Label>
            <Input
              id="prod-image-url"
              type="url"
              {...register('imageUrl')}
              placeholder="https://example.com/gorsel.jpg"
            />
            {errors.imageUrl && (
              <p className="text-xs text-accent">{errors.imageUrl.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              id="prod-available"
              type="checkbox"
              {...register('available')}
              className="h-4 w-4 accent-accent rounded"
            />
            <Label htmlFor="prod-available">Müsait</Label>
          </div>

          {serverError && <p className="text-sm text-accent">{serverError}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Kaydediliyor…' : product ? 'Güncelle' : 'Ekle'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
