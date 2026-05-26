import { test, expect } from '@playwright/test';

test.describe('Authentication flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows login page when unauthenticated', async ({ page }) => {
    await expect(page.locator('.login-card')).toBeVisible();
    await expect(page.locator('h1.header-title')).toContainText('SGCF');
    await expect(page.locator('input[placeholder="Ej: admin"]')).toBeVisible();
    await expect(page.locator('button:has-text("Iniciar sesión")')).toBeVisible();
  });

  test('displays error on invalid credentials', async ({ page }) => {
    await page.fill('input[placeholder="Ej: admin"]', 'wronguser');
    await page.fill('input[placeholder="••••••••"]', 'wrongpass');
    await page.click('button:has-text("Iniciar sesión")');

    // Should stay on login page after failed login
    await expect(page.locator('.login-card')).toBeVisible();
  });

  test('redirects to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/alumnos');
    await expect(page.locator('.login-card')).toBeVisible();
  });

  test('redirects to login when accessing /inicio without auth', async ({ page }) => {
    await page.goto('/inicio');
    await expect(page.locator('.login-card')).toBeVisible();
  });

  test('redirects from / to /inicio when authenticated', async ({ page }) => {
    // Set auth state in localStorage before navigation
    await page.evaluate(() => {
      const user = {
        id_usuario: 1,
        username: 'admin',
        id_rol: 1,
        id_carrera: 1,
        activo: true,
        estado: 'activo',
      };
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('user', JSON.stringify(user));
    });

    await page.goto('/');
    await expect(page.locator('.home-hub')).toBeVisible();
  });

  test('shows user info in header when authenticated', async ({ page }) => {
    await page.evaluate(() => {
      const user = {
        id_usuario: 1,
        username: 'admin',
        id_rol: 1,
        id_carrera: 1,
        activo: true,
        estado: 'activo',
      };
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('user', JSON.stringify(user));
    });

    await page.goto('/inicio');
    await expect(page.locator('.profile-name')).toContainText('admin');
  });

  test('logs out and redirects to login', async ({ page }) => {
    await page.evaluate(() => {
      const user = {
        id_usuario: 1,
        username: 'admin',
        id_rol: 1,
        id_carrera: 1,
        activo: true,
        estado: 'activo',
        permissions: ['*'],
      };
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('user', JSON.stringify(user));
    });

    await page.goto('/inicio');
    await expect(page.locator('.home-hub')).toBeVisible();

    // Open profile dropdown and click logout
    await page.click('.profile-trigger');
    await page.click('button:has-text("Cerrar sesión")');

    // Should be redirected to login
    await expect(page.locator('.login-card')).toBeVisible();
  });

  test('redirects inactive user with reason query', async ({ page }) => {
    await page.evaluate(() => {
      const user = {
        id_usuario: 1,
        username: 'inactive_user',
        id_rol: 1,
        id_carrera: 1,
        activo: false,
        estado: 'inactivo',
      };
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('user', JSON.stringify(user));
    });

    await page.goto('/inicio');

    // Should be redirected to login with reason=inactive
    await expect(page.locator('.login-card')).toBeVisible();
    await expect(page).toHaveURL(/reason=inactive/);
  });
});
