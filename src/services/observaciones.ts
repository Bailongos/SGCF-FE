// src/services/observaciones.ts
import { api } from './api';

export interface TipoObservacion {
  clave: string;
  nombre: string;
}

export interface Observacion {
  id_observacion: number;
  matricula: string;
  detalle: string;
  tipo_clave: string;
  tipo_nombre?: string | null;
  id_autor: number | null;
  fecha: string; // viene de la columna TIMESTAMP/DATE
}

export interface ObservacionPayload {
  matricula: string;
  detalle: string;
  tipo_clave: string;
  id_autor: number | null;
}

export interface ObservacionesQuery {
  matricula?: string;
  tipo?: string;
}

interface TipoObservacionApiResponse {
  clave?: string | null;
  nombre?: string | null;
}

interface ObservacionApiResponse {
  id_observacion: number | string;
  matricula?: string | null;
  detalle?: string | null;
  tipo_clave?: string | null;
  tipo_nombre?: string | null;
  id_autor?: number | string | null;
  fecha?: string | null;
}

function normalizeTipoClave(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

function normalizeTipoObservacion(raw: TipoObservacionApiResponse): TipoObservacion {
  return {
    clave: normalizeTipoClave(raw.clave),
    nombre: String(raw.nombre ?? '').trim() || normalizeTipoClave(raw.clave),
  };
}

function normalizeObservacion(raw: ObservacionApiResponse): Observacion {
  return {
    id_observacion: Number(raw.id_observacion),
    matricula: String(raw.matricula ?? '').trim(),
    detalle: String(raw.detalle ?? '').trim(),
    tipo_clave: normalizeTipoClave(raw.tipo_clave),
    tipo_nombre: raw.tipo_nombre ? String(raw.tipo_nombre).trim() : null,
    id_autor:
      raw.id_autor === null || raw.id_autor === undefined || raw.id_autor === ''
        ? null
        : Number(raw.id_autor),
    fecha: String(raw.fecha ?? ''),
  };
}

// Coincide con el backend, asumiendo prefijo /api en api.ts
const BASE_PATH = '/observaciones';

export async function getTiposObservacion(): Promise<TipoObservacion[]> {
  const { data } = await api.get<TipoObservacionApiResponse[]>('/tipos-observacion');
  return data.map(normalizeTipoObservacion);
}

export async function getObservaciones(query?: ObservacionesQuery): Promise<Observacion[]> {
  const { data } = await api.get<ObservacionApiResponse[]>(BASE_PATH, {
    params: {
      matricula: query?.matricula?.trim() || undefined,
      tipo: query?.tipo?.trim() || undefined,
    },
  });
  return data.map(normalizeObservacion);
}

export async function createObservacion(
  payload: ObservacionPayload,
): Promise<Observacion> {
  const { data } = await api.post<ObservacionApiResponse>(BASE_PATH, payload);
  return normalizeObservacion(data);
}

export async function updateObservacion(
  id_observacion: number,
  payload: ObservacionPayload,
): Promise<Observacion> {
  const { data } = await api.put<ObservacionApiResponse>(
    `${BASE_PATH}/${id_observacion}`,
    payload,
  );
  return normalizeObservacion(data);
}

export async function deleteObservacion(
  id_observacion: number,
): Promise<void> {
  await api.delete(`${BASE_PATH}/${id_observacion}`);
}
