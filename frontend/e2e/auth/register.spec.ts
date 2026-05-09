import { test, expect } from '@playwright/test'

const BACKEND = 'http://localhost:8080'

test.describe('Kayıt akışı', () => {
  test('geçerli bilgilerle BUSINESS kaydı → dashboard yönlenme', async ({ page, request }) => {
    const email = `reg-biz-${Date.now()}@example.com`

    await page.goto('/register')
    await page.getByRole('button', { name: 'Esnaf' }).click()
    await page.fill('#firstName', 'Ahmet')
    await page.fill('#lastName', 'Yılmaz')
    await page.fill('#email', email)
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Kayıt Ol' }).click()

    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })
  })

  test('zaten kayıtlı email → hata mesajı', async ({ page, request }) => {
    const email = `dup-${Date.now()}@example.com`
    await request.post(`${BACKEND}/api/v1/auth/register`, {
      data: { fullName: 'Mevcut Kullanıcı', email, password: 'password123', role: 'USER' },
    })

    await page.goto('/register')
    await page.fill('#firstName', 'Test')
    await page.fill('#lastName', 'User')
    await page.fill('#email', email)
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Kayıt Ol' }).click()

    await expect(page.getByText('Bu e-posta adresi zaten kayıtlı.')).toBeVisible()
  })

  test('kısa şifre → form validasyon mesajı (submit olmaz)', async ({ page }) => {
    await page.goto('/register')
    await page.fill('#firstName', 'Test')
    await page.fill('#lastName', 'User')
    await page.fill('#email', 'valid@example.com')
    await page.fill('#password', 'abc')
    await page.getByRole('button', { name: 'Kayıt Ol' }).click()

    await expect(page.getByText('Şifre en az 6 karakter olmalıdır')).toBeVisible()
    await expect(page).toHaveURL('/register')
  })
})
