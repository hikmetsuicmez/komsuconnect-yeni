// src/components/dashboard/ProductTable.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import type { Product } from '@/types/business'
import ProductModal from './ProductModal'

interface ProductTableProps {
  businessId: string
}

export default function ProductTable({ businessId }: ProductTableProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get<Product[]>(
        `/api/v1/businesses/${businessId}/products`
      )
      setProducts(response.data)
    } catch {
      setError('Ürünler yüklenirken bir hata oluştu.')
    } finally {
      setIsLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`"${product.name}" ürününü silmek istediğinizden emin misiniz?`)) return
    try {
      await api.delete(`/api/v1/businesses/${businessId}/products/${product.id}`)
      await fetchProducts()
    } catch {
      alert('Ürün silinirken bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  const openAddModal = () => {
    setEditingProduct(undefined)
    setModalOpen(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setModalOpen(true)
  }

  const handleModalSuccess = () => {
    setModalOpen(false)
    fetchProducts()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-foreground/60 animate-pulse">Yükleniyor…</div>
      </div>
    )
  }

  if (error) {
    return <p className="text-accent">{error}</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Ürünlerim</h1>
          <p className="text-foreground/60 mt-1">
            {products.length} ürün
          </p>
        </div>
        <Button onClick={openAddModal} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Yeni Ürün Ekle
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-muted bg-surface p-12 text-center">
          <p className="text-foreground/60 mb-4">Henüz ürün eklenmedi.</p>
          <Button onClick={openAddModal} variant="outline">
            İlk ürününü ekle
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-muted overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-muted bg-muted/30">
                <th className="text-left px-4 py-3 text-foreground/60 font-medium">
                  Ürün Adı
                </th>
                <th className="text-left px-4 py-3 text-foreground/60 font-medium">
                  Fiyat
                </th>
                <th className="text-left px-4 py-3 text-foreground/60 font-medium">
                  Durum
                </th>
                <th className="text-right px-4 py-3 text-foreground/60 font-medium">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr
                  key={product.id}
                  className={`border-b border-muted last:border-0 ${
                    index % 2 === 0 ? 'bg-surface' : 'bg-surface/60'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      {product.description && (
                        <p className="text-foreground/50 text-xs mt-0.5 line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    ₺{product.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.available
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-foreground/10 text-foreground/50'
                      }`}
                    >
                      {product.available ? 'Müsait' : 'Tükendi'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="p-1.5 text-foreground/40 hover:text-foreground transition-colors rounded"
                        aria-label="Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        className="p-1.5 text-foreground/40 hover:text-accent transition-colors rounded"
                        aria-label="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ProductModal
          businessId={businessId}
          product={editingProduct}
          onClose={() => setModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}
