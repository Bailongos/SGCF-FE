// src/services/auth.ts
import { api } from './api';

export interface AuthUserResponse {
  id_usuario: number;
  username: string;
  email?: string | null;
  id_rol: number | string;
  id_carrera: number | string | null;
  rol_nombre?: string;
  activo?: boolean;
  estado?: string | null;
  permissions?: string[]; // Permisos retornados por el backend
}

export interface LoginResponse {
  token: string;
  user: AuthUserResponse;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email?: string | null;
  id_rol?: number;
  id_carrera?: number | null;
  activo?: boolean;
}

export interface RegisterResponse {
  message?: string;
  user?: {
    id_usuario?: number;
    username?: string;
    activo?: boolean;
    rol_nombre?: string;
  };
}

export interface MicrosoftTokenResponse {
  token_type: 'Bearer';
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { username, password });
  return data;
}

export async function loginWithGoogle(id_token: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/google', { token: id_token });
  return data;
}

export async function loginWithMicrosoft(payload: {
  id_token?: string;
  code?: string;
}): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/microsoft', payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/auth/register', payload);
  return data;
}

export async function logout(): Promise<void> {
  // Opcional: llamar al backend si es necesario invalidar token
}
