import { api } from './api';

export interface AdminUsuario {
  id_usuario: number;
  username: string;
  email?: string | null;
  id_rol: number | string;
  id_carrera: number | string | null;
  activo?: boolean;
  estado?: string | null;
  rol_nombre?: string;
  fecha_creacion?: string | null;
  created_at?: string | null;
  local_enabled?: boolean;
  google_linked?: boolean;
  microsoft_linked?: boolean;
  [key: string]: unknown;
}

export interface AdminRol {
  id_rol: number;
  nombre_rol: string;
}

export interface AdminCarrera {
  id_carrera: number;
  clave: string;
  nombre: string;
}

interface AdminCarreraApiResponse {
  id_carrera: number | string;
  clave?: string | null;
  nombre?: string | null;
}

function normalizeAdminCarrera(raw: AdminCarreraApiResponse): AdminCarrera {
  return {
    id_carrera: Number(raw.id_carrera),
    clave: String(raw.clave ?? '').trim(),
    nombre: String(raw.nombre ?? '').trim(),
  };
}

export interface AdminUsuarioPayload {
  username?: string;
  email?: string | null;
  password?: string;
  id_rol?: number;
  id_carrera?: number | null;
  activo?: boolean;
}

const BASE_ADMIN = '/admin';

function shouldFallback(error: any): boolean {
  const status = Number(error?.response?.status ?? 0);
  const code = String(error?.code ?? '');
  const message = String(error?.message ?? '').toLowerCase();
  
  // ERR_NETWORK o message "network error" suelen indicar bloqueo de CORS preflight
  return (
    code === 'ERR_NETWORK' || 
    message.includes('network error') ||
    status === 404 || 
    status === 405 || 
    status >= 500
  );
}

async function getLegacyUsuarioById(id_usuario: number): Promise<AdminUsuario | null> {
  const { data } = await api.get<AdminUsuario[]>('/usuarios');
  const found = data.find((item) => Number(item.id_usuario) === Number(id_usuario));
  return found ?? null;
}

function normalizeCareerId(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

async function buildLegacyPutPayload(
  id_usuario: number,
  payload: AdminUsuarioPayload,
): Promise<AdminUsuarioPayload> {
  if (payload.username && payload.id_rol !== undefined) {
    return payload;
  }

  const current = await getLegacyUsuarioById(id_usuario);
  if (!current) {
    return payload;
  }

  return {
    username: payload.username ?? current.username,
    id_rol: payload.id_rol ?? Number(current.id_rol),
    id_carrera:
      payload.id_carrera !== undefined
        ? payload.id_carrera
        : normalizeCareerId(current.id_carrera),
    activo: payload.activo ?? Boolean(current.activo),
    email: payload.email ?? (current.email ?? null),
    password: payload.password,
  };
}

export async function getAdminUsuarios(): Promise<AdminUsuario[]> {
  try {
    const { data } = await api.get<AdminUsuario[]>(`${BASE_ADMIN}/usuarios`);
    return data;
  } catch (error: any) {
    if (shouldFallback(error)) {
      const fallback = await api.get<AdminUsuario[]>('/usuarios');
      return fallback.data;
    }
    throw error;
  }
}

export async function createAdminUsuario(
  payload: AdminUsuarioPayload,
): Promise<AdminUsuario> {
  try {
    const { data } = await api.post<AdminUsuario>(`${BASE_ADMIN}/usuarios`, payload);
    return data;
  } catch (error: any) {
    if (shouldFallback(error)) {
      const fallback = await api.post<AdminUsuario>('/usuarios', payload);
      return fallback.data;
    }
    throw error;
  }
}

export async function patchAdminUsuario(
  id_usuario: number,
  payload: AdminUsuarioPayload,
): Promise<AdminUsuario> {
  try {
    // Intentamos PUT en la ruta admin, ya que PATCH suele estar bloqueado por CORS en Render
    const { data } = await api.put<AdminUsuario>(
      `${BASE_ADMIN}/usuarios/${id_usuario}`,
      payload,
    );
    return data;
  } catch (error: any) {
    if (shouldFallback(error)) {
      const fallbackPayload = await buildLegacyPutPayload(id_usuario, payload);
      const fallback = await api.put<AdminUsuario>(`/usuarios/${id_usuario}`, fallbackPayload);
      return fallback.data;
    }
    throw error;
  }
}

export async function getAdminRoles(): Promise<AdminRol[]> {
  try {
    const { data } = await api.get<AdminRol[]>(`${BASE_ADMIN}/roles`);
    return data;
  } catch (error: any) {
    if (shouldFallback(error)) {
      const fallback = await api.get<AdminRol[]>('/roles');
      return fallback.data;
    }
    throw error;
  }
}

export async function getAdminCarreras(): Promise<AdminCarrera[]> {
  try {
    const { data } = await api.get<AdminCarreraApiResponse[]>(`${BASE_ADMIN}/carreras`);
    return data.map(normalizeAdminCarrera);
  } catch (error: any) {
    if (shouldFallback(error)) {
      const fallback = await api.get<AdminCarreraApiResponse[]>('/carreras');
      return fallback.data.map(normalizeAdminCarrera);
    }
    throw error;
  }
}
