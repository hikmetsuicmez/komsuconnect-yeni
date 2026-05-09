import { test, expect } from '@playwright/test'

const BACKEND = 'http://localhost:8080'

test.describe('Esnaf profil yönetimi', () => {
  let businessEmail: string
  let userEmail: string

  test.beforeAll(async ({ request }) => {
    businessEmail = `profile-biz-${Date.now()}@example.com`
    userEmail = `profile-user-${Date.now()}@example.com`

    await request.post(`${BACKEND}/api/v1/auth/register`, {
      data: { fullName: 'Profil Testi Esnaf', email: businessEmail, password: 'password123', role: 'BUSINESS' },
    })
    await request.post(`${BACKEND}/api/v1/auth/register`, {
      data: { fullName: 'Normal Kullanici', email: userEmail, password: 'password123', role: 'USER' },
    })
  })

  test('BUSINESS rolü → profil oluştur → başarı mesajı', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', businessEmail)
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })

    await page.goto('/dashboard/profile')
    await page.fill('#businessName', 'Test Fırını')
    await page.fill('#city', 'İstanbul')
    await page.getByRole('button', { name: /Profil Oluştur|Güncelle/ }).click()

    await expect(page.getByText('Profil başarıyla kaydedildi.')).toBeVisible()
  })

  test('zorunlu alan boş → validasyon mesajı gösterilir', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', businessEmail)
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })

    await page.goto('/dashboard/profile')
    await page.fill('#businessName', '')
    await page.getByRole('button', { name: /Profil Oluştur|Güncelle/ }).click()

    await expect(page.getByText('İşletme adı zorunludur')).toBeVisible()
  })

  test('USER rolü /dashboard → ana sayfaya yönlenme', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', userEmail)
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await expect(page).toHaveURL('/', { timeout: 5000 })

    await page.goto('/dashboard')
    await expect(page).toHaveURL('/')
  })
})
