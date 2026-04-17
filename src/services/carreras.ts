// src/services/carreras.ts
import { api } from './api';

export interface Carrera {
  id_carrera: number;
  clave: string;
  nombre: string;
  duracion_semestres: number;
}

export interface CarreraCreate {
  clave: string;
  nombre: string;
  duracion_semestres: number;
}

interface CarreraApiResponse {
  id_carrera: number | string;
  clave?: string | null;
  nombre?: string | null;
  duracion_semestres?: number | string | null;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function normalizeCarrera(raw: CarreraApiResponse): Carrera {
  return {
    id_carrera: toNumber(raw.id_carrera),
    clave: String(raw.clave ?? '').trim(),
    nombre: String(raw.nombre ?? '').trim(),
    duracion_semestres: toNumber(raw.duracion_semestres, 0),
  };
}

export async function getCarreras(): Promise<Carrera[]> {
  const { data } = await api.get<CarreraApiResponse[]>('/carreras');
  return data.map(normalizeCarrera);
}

export async function createCarrera(
  payload: CarreraCreate,
): Promise<Carrera> {
  const { data } = await api.post<CarreraApiResponse>('/carreras', payload);
  return normalizeCarrera(data);
}

export async function updateCarrera(
  id: number,
  payload: Partial<CarreraCreate>,
): Promise<Carrera> {
  const { data } = await api.put<CarreraApiResponse>(`/carreras/${id}`, payload);
  return normalizeCarrera(data);
}

export async function deleteCarrera(id: number): Promise<void> {
  await api.delete(`/carreras/${id}`);
}
