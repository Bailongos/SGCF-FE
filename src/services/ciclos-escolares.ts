// src/services/ciclos-escolares.ts
import { api } from './api';

export interface CicloEscolar {
  id_ciclo: number;
  nombre: string;
  fecha_inicio: string; // ISO string desde el backend
  fecha_fin: string;
  es_actual: boolean;
}

export interface CicloEscolarPayload {
  nombre: string;
  fecha_inicio: string; // 'YYYY-MM-DD'
  fecha_fin: string;    // 'YYYY-MM-DD'
  es_actual: boolean;
}

// Coincide con el backend:
// AppRoutes -> app.register(ciclosRoutes, { prefix: '/api/ciclos-escolares' });
const BASE_PATH = '/ciclos-escolares';

export async function getCiclosEscolares(): Promise<CicloEscolar[]> {
  const { data } = await api.get<CicloEscolar[]>(BASE_PATH);
  return data;
}

export async function createCicloEscolar(
  payload: CicloEscolarPayload,
): Promise<CicloEscolar> {
  const { data } = await api.post<CicloEscolar>(BASE_PATH, payload);
  return data;
}

export async function updateCicloEscolar(
  id_ciclo: number,
  payload: CicloEscolarPayload,
): Promise<CicloEscolar> {
  const { data } = await api.put<CicloEscolar>(`${BASE_PATH}/${id_ciclo}`, payload);
  return data;
}

export async function deleteCicloEscolar(id_ciclo: number): Promise<void> {
  await api.delete(`${BASE_PATH}/${id_ciclo}`);
}
