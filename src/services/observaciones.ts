// src/services/observaciones.ts
import { api } from './api';

export interface Observacion {
  id_observacion: number;
  matricula: string;
  detalle: string;
  id_autor: number | null;
  fecha: string; // viene de la columna TIMESTAMP/DATE
}

export interface ObservacionPayload {
  matricula: string;
  detalle: string;
  id_autor: number | null;
}

// Coincide con el backend, asumiendo prefijo /api en api.ts
const BASE_PATH = '/observaciones';

export async function getObservaciones(): Promise<Observacion[]> {
  const { data } = await api.get<Observacion[]>(BASE_PATH);
  return data;
}

export async function createObservacion(
  payload: ObservacionPayload,
): Promise<Observacion> {
  const { data } = await api.post<Observacion>(BASE_PATH, payload);
  return data;
}

export async function updateObservacion(
  id_observacion: number,
  payload: ObservacionPayload,
): Promise<Observacion> {
  const { data } = await api.put<Observacion>(
    `${BASE_PATH}/${id_observacion}`,
    payload,
  );
  return data;
}

export async function deleteObservacion(
  id_observacion: number,
): Promise<void> {
  await api.delete(`${BASE_PATH}/${id_observacion}`);
}
