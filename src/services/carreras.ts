// src/services/carreras.ts
import { api } from './api';

export interface Carrera {
  id_carrera: number;
  nombre: string;
  duracion_semestres: number;
}

export interface CarreraCreate {
  nombre: string;
  duracion_semestres: number;
}

export async function getCarreras(): Promise<Carrera[]> {
  const { data } = await api.get<Carrera[]>('/carreras');
  return data;
}

export async function createCarrera(
  payload: CarreraCreate,
): Promise<Carrera> {
  const { data } = await api.post<Carrera>('/carreras', payload);
  return data;
}

export async function updateCarrera(
  id: number,
  payload: Partial<CarreraCreate>,
): Promise<Carrera> {
  // 👇 aquí estaba el error: antes era "/carrera/..."
  const { data } = await api.put<Carrera>(`/carreras/${id}`, payload);
  return data;
}

export async function deleteCarrera(id: number): Promise<void> {
  await api.delete(`/carreras/${id}`);
}
