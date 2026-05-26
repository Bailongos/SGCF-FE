import { test, expect } from '@playwright/test';

const ADMIN_USER = {
  id_usuario: 1,
  username: 'admin',
  id_rol: 1,
  id_carrera: 1,
  activo: true,
  estado: 'activo',
  permissions: ['*'],
};

const COORD_USER = {
  id_usuario: 2,
  username: 'coordinador',
  id_rol: 2,
  id_carrera: 1,
  activo: true,
  estado: 'activo',
};

const CAJA_USER = {
  id_usuario: 3,
  username: 'cajero',
  id_rol: 3,
  id_carrera: null,
  activo: true,
  estado: 'activo',
};

test.beforeEach(async ({ page }) => {
  // Clear state before each test
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test.describe('Navigation by role', () => {
  test('admin can access all routes', async ({ page }) => {
    await page.evaluate((user) => {
      localStorage.setItem('token', 'admin-token');
      localStorage.setItem('user', JSON.stringify(user));
    }, ADMIN_USER);

    const routes = ['/inicio', '/alumnos', '/carreras', '/cuentas', '/roles', '/admin/usuarios-permisos'];
    for (const route of routes) {
      await page.goto(route);
      // Should not be redirected to login
      await expect(page.locator('.login-card')).not.toBeVisible();
    }
  });

  test('coordinator can access scoped routes when career is set', async ({ page }) => {
    await page.evaluate((user) => {
      localStorage.setItem('token', 'coord-token');
      localStorage.setItem('user', JSON.stringify(user));
    }, COORD_USER);

    await page.goto('/alumnos');
    await expect(page.locator('.login-card')).not.toBeVisible();
  });

  test('coordinator without career cannot access scoped routes', async ({ page }) => {
    const coordNoCareer = { ...COORD_USER, id_carrera: null };

    await page.evaluate((user) => {
      localStorage.setItem('token', 'coord-token');
      localStorage.setItem('user', JSON.stringify(user));
    }, coordNoCareer);

    // Scoped route should redirect to inicio
    await page.goto('/alumnos');
    await expect(page).toHaveURL(/\/inicio/);
  });

  test('caja cannot access admin routes', async ({ page }) => {
    await page.evaluate((user) => {
      localStorage.setItem('token', 'caja-token');
      localStorage.setItem('user', JSON.stringify(user));
    }, CAJA_USER);

    await page.goto('/admin/usuarios-permisos');
    // Should be redirected to /inicio
    await expect(page).toHaveURL(/\/inicio/);
  });

  test('register page is accessible without auth', async ({ page }) => {
    await page.goto('/registro');
    await expect(page.locator('.register-card')).toBeVisible();
  });

  test('register page redirects authenticated users to inicio', async ({ page }) => {
    await page.evaluate((user) => {
      localStorage.setItem('token', 'admin-token');
      localStorage.setItem('user', JSON.stringify(user));
    }, ADMIN_USER);

    await page.goto('/registro');
    await expect(page).toHaveURL(/\/inicio/);
  });
});
