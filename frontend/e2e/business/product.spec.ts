import { test, expect } from '@playwright/test'

const BACKEND = 'http://localhost:8080'

test.describe('Ürün yönetimi', () => {
  let businessEmail: string
  let authToken: string

  test.beforeAll(async ({ request }) => {
    businessEmail = `product-biz-${Date.now()}@example.com`

    const registerRes = await request.post(`${BACKEND}/api/v1/auth/register`, {
      data: { fullName: 'Ürün Testi Esnaf', email: businessEmail, password: 'password123', role: 'BUSINESS' },
    })
    const data = await registerRes.json()
    authToken = data.token

    await request.post(`${BACKEND}/api/v1/businesses`, {
      data: { businessName: 'E2E Test Dükkanı', city: 'Ankara' },
      headers: { Authorization: `Bearer ${authToken}` },
    })
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', businessEmail)
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })
  })

  test('ürün ekleme → listede görünür', async ({ page }) => {
    await page.goto('/dashboard/products')

    const addButton = page.getByRole('button', { name: 'Yeni Ürün Ekle' })
      .or(page.getByRole('button', { name: 'İlk ürününü ekle' }))
    await addButton.first().click()

    await page.fill('#prod-name', 'Tam Buğday Ekmeği')
    await page.fill('#prod-price', '5.50')
    await page.getByRole('button', { name: 'Ekle' }).click()

    await expect(page.getByText('Tam Buğday Ekmeği')).toBeVisible({ timeout: 5000 })
  })

  test('ürün düzenleme → güncellendi', async ({ page }) => {
    await page.goto('/dashboard/products')

    const addButton = page.getByRole('button', { name: 'Yeni Ürün Ekle' })
      .or(page.getByRole('button', { name: 'İlk ürününü ekle' }))
    await addButton.first().click()
    await page.fill('#prod-name', 'Düzenleme Testi')
    await page.fill('#prod-price', '3.00')
    await page.getByRole('button', { name: 'Ekle' }).click()
    await expect(page.getByText('Düzenleme Testi')).toBeVisible({ timeout: 5000 })

    await page.getByRole('button', { name: 'Düzenle' }).first().click()
    await page.fill('#prod-name', 'Düzenlenmiş Ürün')
    await page.getByRole('button', { name: 'Güncelle' }).click()

    await expect(page.getByText('Düzenlenmiş Ürün')).toBeVisible({ timeout: 5000 })
  })

  test('fiyat 0 → validasyon hatası', async ({ page }) => {
    await page.goto('/dashboard/products')

    const addButton = page.getByRole('button', { name: 'Yeni Ürün Ekle' })
      .or(page.getByRole('button', { name: 'İlk ürününü ekle' }))
    await addButton.first().click()

    await page.fill('#prod-name', 'Geçersiz Fiyat')
    await page.fill('#prod-price', '0')
    await page.getByRole('button', { name: 'Ekle' }).click()

    await expect(page.getByText("Fiyat 0'dan büyük olmalıdır")).toBeVisible()
  })

  test.fixme('imageUrl ile ürün ekleme → görsel listede render edilir', async ({ page }) => {
    // ProductModal'a imageUrl alanı eklendikten sonra bu testi aktifleştir.
    await page.goto('/dashboard/products')

    const addButton = page.getByRole('button', { name: 'Yeni Ürün Ekle' })
      .or(page.getByRole('button', { name: 'İlk ürününü ekle' }))
    await addButton.first().click()

    await page.fill('#prod-name', 'Görselli Ürün')
    await page.fill('#prod-price', '10.00')
    await page.fill('#prod-image-url', 'https://placehold.co/200x200.png')
    await page.getByRole('button', { name: 'Ekle' }).click()

    await expect(page.locator('img[src="https://placehold.co/200x200.png"]')).toBeVisible({ timeout: 5000 })
  })
})
