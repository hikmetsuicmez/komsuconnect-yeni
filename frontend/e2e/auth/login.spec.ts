import { test, expect } from '@playwright/test'

const BACKEND = 'http://localhost:8080'

test.describe('Giriş akışı', () => {
  let testEmail: string

  test.beforeAll(async ({ request }) => {
    testEmail = `login-${Date.now()}@example.com`
    await request.post(`${BACKEND}/api/v1/auth/register`, {
      data: {
        fullName: 'Login Test Kullanıcı',
        email: testEmail,
        password: 'password123',
        role: 'BUSINESS',
      },
    })
  })

  test('geçerli credentials → dashboard yönlenme', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', testEmail)
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()

    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })
  })

  test('yanlış şifre → hata mesajı', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', testEmail)
    await page.fill('#password', 'yanlis-sifre')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()

    await expect(page.getByText('E-posta veya şifre hatalı.')).toBeVisible()
  })

  test('kayıtsız email → hata mesajı', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'olmayan@example.com')
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()

    await expect(page.getByText('E-posta veya şifre hatalı.')).toBeVisible()
  })

  test('sayfa yenilemede oturum korunur', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', testEmail)
    await page.fill('#password', 'password123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })

    await page.reload()
    await expect(page).toHaveURL('/dashboard')
  })
})
