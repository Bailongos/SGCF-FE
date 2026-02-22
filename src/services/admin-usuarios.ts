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
  nombre: string;
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

export async function getAdminUsuarios(): Promise<AdminUsuario[]> {
  try {
    const { data } = await api.get<AdminUsuario[]>(`${BASE_ADMIN}/usuarios`);
    return data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
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
    if (error?.response?.status === 404) {
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
    const { data } = await api.patch<AdminUsuario>(
      `${BASE_ADMIN}/usuarios/${id_usuario}`,
      payload,
    );
    return data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      const fallback = await api.put<AdminUsuario>(`/usuarios/${id_usuario}`, payload);
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
    if (error?.response?.status === 404) {
      const fallback = await api.get<AdminRol[]>('/roles');
      return fallback.data;
    }
    throw error;
  }
}

export async function getAdminCarreras(): Promise<AdminCarrera[]> {
  try {
    const { data } = await api.get<AdminCarrera[]>(`${BASE_ADMIN}/carreras`);
    return data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      const fallback = await api.get<AdminCarrera[]>('/carreras');
      return fallback.data;
    }
    throw error;
  }
}
