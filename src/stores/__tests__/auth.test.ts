import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth';

function mockLocalStorage(data: Record<string, string>) {
  localStorage.clear();
  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(key, value);
  }
}

beforeEach(() => {
  setActivePinia(createPinia());
  localStorage.clear();
});

describe('auth store', () => {
  describe('initialization', () => {
    it('initializes with no user when localStorage is empty', () => {
      const store = useAuthStore();
      store.initialize();

      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });

    it('restores user from localStorage', () => {
      const userData = { id_usuario: 1, username: 'admin', id_rol: 1, id_carrera: null, activo: true };
      mockLocalStorage({
        token: 'test-token',
        user: JSON.stringify(userData),
      });

      const store = useAuthStore();
      store.initialize();

      expect(store.user).toEqual(userData);
      expect(store.token).toBe('test-token');
      expect(store.isAuthenticated).toBe(true);
    });

    it('handles corrupted user data in localStorage', () => {
      mockLocalStorage({
        token: 'test-token',
        user: '{corrupted-json',
      });

      const store = useAuthStore();
      store.initialize();

      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
    });
  });

  describe('role detection', () => {
    it('detects administrador by role id 1', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'admin', id_rol: 1, id_carrera: null, activo: true } as any;
      store.token = 'token';

      expect(store.currentRole).toBe('administrador');
      expect(store.isAdmin).toBe(true);
      expect(store.isCoordinator).toBe(false);
    });

    it('detects coordinador by role id 2', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 2, username: 'coord', id_rol: 2, id_carrera: 1, activo: true } as any;
      store.token = 'token';

      expect(store.currentRole).toBe('coordinador');
      expect(store.isCoordinator).toBe(true);
    });

    it('detects caja by role id 3', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 3, username: 'cashier', id_rol: 3, id_carrera: null, activo: true } as any;
      store.token = 'token';

      expect(store.currentRole).toBe('caja');
      expect(store.isCashier).toBe(true);
    });

    it('normalizes role name from rol_nombre', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 4, username: 'test', id_rol: 0, rol_nombre: 'COORDINADOR', id_carrera: null, activo: true } as any;
      store.token = 'token';

      expect(store.currentRole).toBe('coordinador');
    });

    it('normalizes role with accent stripping', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 5, username: 'test', id_rol: 0, rol_nombre: 'Coordinador', id_carrera: null, activo: true } as any;
      store.token = 'token';

      expect(store.currentRole).toBe('coordinador');
    });

    it('detects admin from username when no role info', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 6, username: 'Admin', id_rol: 0, id_carrera: null, activo: true } as any;
      store.token = 'token';

      expect(store.currentRole).toBe('administrador');
    });
  });

  describe('user status', () => {
    it('detects activo from boolean', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 6, id_carrera: null, activo: true } as any;

      expect(store.userStatus).toBe('activo');
      expect(store.isUserActive).toBe(true);
    });

    it('detects inactivo from boolean false', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 6, id_carrera: null, activo: false } as any;

      expect(store.userStatus).toBe('inactivo');
      expect(store.isUserActive).toBe(false);
    });

    it('detects pendiente from estado', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 6, id_carrera: null, activo: true, estado: 'pendiente' } as any;

      expect(store.userStatus).toBe('pendiente');
      expect(store.isUserActive).toBe(false);
    });
  });

  describe('permission checking', () => {
    it('can() returns true for admin with * permission', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'admin', id_rol: 1, id_carrera: null, activo: true } as any;

      expect(store.can('view.alumnos')).toBe(true);
      expect(store.can('anything')).toBe(true);
    });

    it('can() returns false for inactive user', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 6, id_carrera: null, activo: false } as any;

      expect(store.can('view.inicio')).toBe(false);
    });

    it('can() uses backend permissions when present', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 6, id_carrera: null, activo: true, permissions: ['view.inicio'] } as any;

      expect(store.can('view.inicio')).toBe(true);
      expect(store.can('view.alumnos')).toBe(false);
    });

    it('can() uses role-based permissions when no backend permissions', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 4, id_carrera: null, activo: true } as any;

      expect(store.can('view.inicio')).toBe(true);
      expect(store.can('view.alumnos')).toBe(false);
    });

    it('can() returns true when permission is null/undefined', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 4, id_carrera: null, activo: true } as any;

      expect(store.can(null)).toBe(true);
      expect(store.can(undefined)).toBe(true);
    });
  });

  describe('canAny', () => {
    it('returns true for empty array', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 4, id_carrera: null, activo: true } as any;

      expect(store.canAny([])).toBe(true);
      expect(store.canAny(null)).toBe(true);
    });

    it('returns true if any permission matches', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 4, id_carrera: null, activo: true, permissions: ['view.inicio'] } as any;

      expect(store.canAny(['view.inicio', 'view.alumnos'])).toBe(true);
    });

    it('returns false if no permissions match', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 4, id_carrera: null, activo: true } as any;

      expect(store.canAny(['view.admin.usuarios_permisos'])).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('returns true for empty roles', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 4, id_carrera: null, activo: true } as any;

      expect(store.hasAnyRole([])).toBe(true);
      expect(store.hasAnyRole(null)).toBe(true);
    });

    it('returns true if role matches', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 1, id_carrera: null, activo: true } as any;

      expect(store.hasAnyRole(['administrador'])).toBe(true);
    });

    it('returns false if role does not match', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 6, id_carrera: null, activo: true } as any;

      expect(store.hasAnyRole(['administrador', 'coordinador'])).toBe(false);
    });

    it('returns false for inactive user', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 1, id_carrera: null, activo: false } as any;

      expect(store.hasAnyRole(['administrador'])).toBe(false);
    });
  });

  describe('session management', () => {
    it('initialize restores token and user from localStorage', () => {
      const userData = { id_usuario: 1, username: 'test', id_rol: 6, id_carrera: null, activo: true };
      mockLocalStorage({
        token: 'new-token',
        user: JSON.stringify(userData),
      });

      const store = useAuthStore();
      store.initialize();

      expect(store.token).toBe('new-token');
      expect(store.user).toEqual(userData);
    });

    it('logout clears everything', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 6, id_carrera: null, activo: true } as any;
      store.token = 'token';
      localStorage.setItem('token', 'token');
      localStorage.setItem('user', '{}');

      store.logout();

      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('userCareerId', () => {
    it('returns career id from user', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 2, id_carrera: 5, activo: true } as any;

      expect(store.userCareerId).toBe(5);
    });

    it('returns null when no career', () => {
      const store = useAuthStore();
      store.user = { id_usuario: 1, username: 'test', id_rol: 1, id_carrera: null, activo: true } as any;

      expect(store.userCareerId).toBeNull();
    });
  });
});
