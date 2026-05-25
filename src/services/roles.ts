// src/services/roles.ts
import { api } from './api';

export interface Rol {
  id_rol: number;
  nombre_rol: string;
}

export interface RolPayload {
  nombre_rol: string;
}

// En backend debería ser algo como: app.register(rolesRoutes, { prefix: '/api/roles' });
const BASE_PATH = '/roles';

export async function getRoles(): Promise<Rol[]> {
  const { data } = await api.get<Rol[]>(BASE_PATH);
  return data;
}

export async function createRol(payload: RolPayload): Promise<Rol> {
  const { data } = await api.post<Rol>(BASE_PATH, payload);
  return data;
}

export async function updateRol(
  id_rol: number,
  payload: RolPayload,
): Promise<Rol> {
  const { data } = await api.put<Rol>(`${BASE_PATH}/${id_rol}`, payload);
  return data;
}

export async function deleteRol(id_rol: number): Promise<void> {
  await api.delete(`${BASE_PATH}/${id_rol}`);
}

export interface Permiso {
  id_permiso: number;
  clave: string;
  descripcion: string;
  categoria: string;
}

export interface RolPermiso {
  id_rol: number;
  id_permiso: number;
}

export interface RolesPermisosData {
  roles: Rol[];
  permisos: Permiso[];
  rol_permisos: RolPermiso[];
}

export async function getRolesPermisos(): Promise<RolesPermisosData> {
  const { data } = await api.get<RolesPermisosData>('/admin/roles-permisos');
  return data;
}

export async function updateRolesPermisos(
  id_rol: number,
  id_permisos: number[],
): Promise<{ success: boolean }> {
  const { data } = await api.post<{ success: boolean }>('/admin/roles-permisos', {
    id_rol,
    id_permisos,
  });
  return data;
}
