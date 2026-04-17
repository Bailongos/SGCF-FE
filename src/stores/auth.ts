// src/stores/auth.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  login as loginApi,
  loginWithGoogle as loginWithGoogleApi,
  loginWithMicrosoft as loginWithMicrosoftApi,
  type LoginResponse,
} from '../services/auth';
import { getRolePermissionSet, type PermissionKey } from '../security/permissions';
import { logoutMsal } from '../services/msal';

interface AuthUser {
  id_usuario: number;
  username: string;
  email?: string | null;
  id_rol: number | string;
  id_carrera: number | string | null;
  rol_nombre?: string;
  activo?: boolean;
  estado?: string | null;
}

function normalizeRoleName(role: string | null | undefined): string {
  if (!role) return '';

  const normalized = role
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (normalized.includes('admin')) return 'administrador';
  if (normalized.includes('coordin')) return 'coordinador';
  if (normalized.includes('caj')) return 'caja';
  if (normalized.includes('sin rol') || normalized.includes('sin_rol')) return 'sin rol';
  if (normalized.includes('pend')) return 'pendiente';

  return normalized;
}

function readRoleId(user: AuthUser | null): number | null {
  const raw = (user as any)?.id_rol ?? (user as any)?.rol_id ?? (user as any)?.rol?.id_rol;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

function readRoleName(user: AuthUser | null): string {
  const raw =
    (user as any)?.rol_nombre ??
    (user as any)?.rolNombre ??
    (user as any)?.role_name ??
    (user as any)?.role ??
    (user as any)?.rol ??
    (user as any)?.rol?.nombre ??
    (user as any)?.role?.name;

  return typeof raw === 'string' ? raw : '';
}

function readActive(user: AuthUser | null): boolean | null {
  const raw =
    (user as any)?.activo ??
    (user as any)?.is_active ??
    (user as any)?.active;

  if (raw === true || raw === false) return raw;
  if (raw === 1 || raw === '1' || raw === 'true') return true;
  if (raw === 0 || raw === '0' || raw === 'false') return false;
  return null;
}

function readStatus(user: AuthUser | null): string {
  const raw =
    (user as any)?.estado ??
    (user as any)?.status ??
    (user as any)?.estado_usuario;

  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function readCareerId(user: AuthUser | null): number | null {
  const raw =
    (user as any)?.id_carrera ??
    (user as any)?.carrera_id ??
    (user as any)?.idCarrera;

  if (raw === null || raw === undefined || raw === '') return null;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

function roleNameById(idRol: number | string | null | undefined): string {
  const id = Number(idRol);
  if (id === 1) return 'administrador';
  if (id === 2) return 'coordinador';
  if (id === 3) return 'caja';
  if (id === 6) return 'sin rol';
  return '';
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const isAuthenticated = computed(() => !!token.value);

  const currentRole = computed(() => {
    const byId = roleNameById(readRoleId(user.value));
    if (byId) return byId;

    const byName = normalizeRoleName(readRoleName(user.value));
    if (byName) return byName;

    const username = String((user.value as any)?.username ?? '')
      .trim()
      .toLowerCase();

    if (username === 'admin') return 'administrador';

    return '';
  });

  const isAdmin = computed(() => currentRole.value === 'administrador');
  const isCoordinator = computed(() => currentRole.value === 'coordinador');
  const isCashier = computed(() => currentRole.value === 'caja');

  const userStatus = computed(() => {
    const status = readStatus(user.value);

    if (status.includes('pend')) return 'pendiente';
    if (status.includes('inact') || status.includes('baja')) return 'inactivo';
    if (status.includes('act')) return 'activo';

    const active = readActive(user.value);
    if (active === false) return 'inactivo';
    return 'activo';
  });

  const isUserActive = computed(() => userStatus.value === 'activo');

  const userCareerId = computed<number | null>(() => readCareerId(user.value));
  const permissionSet = computed(() => getRolePermissionSet(currentRole.value));

  function can(permission: PermissionKey | string | null | undefined): boolean {
    if (!isUserActive.value) return false;
    if (!permission) return true;
    return permissionSet.value.has('*') || permissionSet.value.has(String(permission));
  }

  function canAny(permissions: Array<PermissionKey | string> | null | undefined): boolean {
    if (!permissions?.length) return true;
    return permissions.some((permission) => can(permission));
  }

  function hasAnyRole(roles: string[] | null | undefined): boolean {
    if (!isUserActive.value) return false;
    if (!roles?.length) return true;

    const allowed = roles.map((role) => normalizeRoleName(role));
    return allowed.includes(currentRole.value);
  }

  function setSession(data: LoginResponse) {
    const sessionToken = String((data as any)?.token ?? (data as any)?.access_token ?? '').trim();
    const sessionUser = ((data as any)?.user ?? (data as any)?.usuario) as AuthUser | null;

    if (!sessionToken || !sessionUser) {
      throw new Error('La respuesta de autenticacion no contiene token o usuario.');
    }

    token.value = sessionToken;
    user.value = sessionUser;
    localStorage.setItem('token', sessionToken);
    localStorage.setItem('user', JSON.stringify(sessionUser));
  }

  async function login(username: string, password: string) {
    const data = await loginApi(username, password);
    setSession(data);
  }

  async function loginWithGoogle(idToken: string) {
    const data = await loginWithGoogleApi(idToken);
    setSession(data);
  }

  async function loginWithMicrosoft(payload: { id_token?: string; code?: string }) {
    const data = await loginWithMicrosoftApi(payload);
    setSession(data);
  }


  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function initialize() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as unknown;
        const candidate = (parsed as any)?.user ?? parsed;
        if (candidate && typeof candidate === 'object') {
          user.value = candidate as AuthUser;
        } else {
          user.value = null;
          localStorage.removeItem('user');
        }
      } catch {
        user.value = null;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    token.value = localStorage.getItem('token');
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isCoordinator,
    isCashier,
    currentRole,
    userStatus,
    isUserActive,
    userCareerId,
    can,
    canAny,
    hasAnyRole,
    login,
    loginWithGoogle,
    loginWithMicrosoft,
    logout,
    initialize,
  };
});
