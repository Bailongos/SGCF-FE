import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

const mockAuthStore = {
  user: null,
  token: null,
  isAuthenticated: false,
  isUserActive: true,
  isCoordinator: false,
  userCareerId: null,
  can: vi.fn(() => true),
  initialize: vi.fn(),
  logout: vi.fn(),
};

vi.mock('../../stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}));

async function createTestRouter() {
  const { default: router } = await import('../../router/index');
  await router.push('/login');
  await router.isReady();
  return router;
}

describe('router navigation guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
    mockAuthStore.user = null;
    mockAuthStore.token = null;
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.isUserActive = true;
    mockAuthStore.isCoordinator = false;
    mockAuthStore.userCareerId = null;
    mockAuthStore.can.mockReturnValue(true);
  });

  it('redirects to Login when route requires auth and user is not authenticated', async () => {
    const router = await createTestRouter();
    await router.push('/inicio');
    expect(router.currentRoute.value.name).toBe('Login');
  });

  it('allows access to Login when not authenticated', async () => {
    const router = await createTestRouter();
    await router.push('/login');
    expect(router.currentRoute.value.name).toBe('Login');
  });

  it('allows access to Register when not authenticated', async () => {
    const router = await createTestRouter();
    await router.push('/registro');
    expect(router.currentRoute.value.name).toBe('Register');
  });

  it('redirects authenticated user from Login to /inicio', async () => {
    mockAuthStore.user = { id_usuario: 1, username: 'test' } as any;
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.isUserActive = true;
    const router = await createTestRouter();
    await router.push('/login');
    expect(router.currentRoute.value.path).toBe('/inicio');
  });

  it('redirects authenticated user from Register to /inicio', async () => {
    mockAuthStore.user = { id_usuario: 1, username: 'test' } as any;
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.isUserActive = true;
    const router = await createTestRouter();
    await router.push('/registro');
    expect(router.currentRoute.value.path).toBe('/inicio');
  });

  it('redirects with reason=inactive when user is not active', async () => {
    mockAuthStore.user = { id_usuario: 1, username: 'test' } as any;
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.isUserActive = false;
    const router = await createTestRouter();
    await router.push('/inicio');
    expect(mockAuthStore.logout).toHaveBeenCalled();
    expect(router.currentRoute.value.name).toBe('Login');
    expect(router.currentRoute.value.query.reason).toBe('inactive');
  });

  it('allows access when user is authenticated and has permission', async () => {
    mockAuthStore.user = { id_usuario: 1, username: 'admin' } as any;
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.isUserActive = true;
    mockAuthStore.can.mockReturnValue(true);
    const router = await createTestRouter();
    await router.push('/inicio');
    expect(router.currentRoute.value.path).toBe('/inicio');
  });

  it('redirects to /inicio when user lacks required permission', async () => {
    mockAuthStore.user = { id_usuario: 1, username: 'test' } as any;
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.isUserActive = true;
    mockAuthStore.can.mockReturnValue(false);
    const router = await createTestRouter();
    await router.push('/alumnos');
    expect(router.currentRoute.value.path).toBe('/inicio');
  });

  it('redirects coordinator without career to /inicio on scoped routes', async () => {
    mockAuthStore.user = { id_usuario: 1, username: 'coord' } as any;
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.isUserActive = true;
    mockAuthStore.isCoordinator = true;
    mockAuthStore.userCareerId = null;
    const router = await createTestRouter();
    await router.push('/alumnos');
    expect(router.currentRoute.value.path).toBe('/inicio');
  });

  it('allows coordinator with career on scoped routes', async () => {
    mockAuthStore.user = { id_usuario: 1, username: 'coord' } as any;
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.isUserActive = true;
    mockAuthStore.isCoordinator = true;
    mockAuthStore.userCareerId = 1;
    mockAuthStore.can.mockReturnValue(true);
    const router = await createTestRouter();
    await router.push('/alumnos');
    expect(router.currentRoute.value.path).toBe('/alumnos');
  });

  it('calls initialize when user is not loaded but localStorage has data', async () => {
    localStorage.setItem('user', JSON.stringify({ id_usuario: 1, username: 'test' }));
    localStorage.setItem('token', 'abc');
    const router = await createTestRouter();
    await router.push('/inicio');
    expect(mockAuthStore.initialize).toHaveBeenCalled();
  });

  it('redirects /usuarios to /admin/usuarios-permisos', async () => {
    mockAuthStore.user = { id_usuario: 1, username: 'admin' } as any;
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.isUserActive = true;
    mockAuthStore.can.mockReturnValue(true);
    const router = await createTestRouter();
    await router.push('/usuarios');
    expect(router.currentRoute.value.path).toBe('/admin/usuarios-permisos');
  });
});
