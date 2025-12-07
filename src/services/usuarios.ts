// src/services/usuarios.ts
import { api } from './api';

export interface Usuario {
  id_usuario: number;
  username: string;
  id_rol: number;
  matricula_alumno: string | null;
  activo: boolean;
}

export interface UsuarioPayload {
  username: string;
  password?: string; // opcional en update
  id_rol: number;
  matricula_alumno?: string | null;
  activo?: boolean;
}

const BASE_PATH = '/usuarios';

export async function getUsuarios(): Promise<Usuario[]> {
  const { data } = await api.get<Usuario[]>(BASE_PATH);
  return data;
}

export async function createUsuario(
  payload: UsuarioPayload,
): Promise<Usuario> {
  const { data } = await api.post<Usuario>(BASE_PATH, payload);
  return data;
}

export async function updateUsuario(
  id_usuario: number,
  payload: UsuarioPayload,
): Promise<Usuario> {
  const { data } = await api.put<Usuario>(
    `${BASE_PATH}/${id_usuario}`,
    payload,
  );
  return data;
}

export async function deleteUsuario(id_usuario: number): Promise<void> {
  await api.delete(`${BASE_PATH}/${id_usuario}`);
}
