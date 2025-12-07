// src/services/conceptos.ts
import { api } from './api';

export interface Concepto {
  clave: string;
  descripcion: string;
  monto_default: number;
  genera_cuenta_default: boolean;
}

export interface ConceptoPayload {
  clave: string;
  descripcion: string;
  monto_default: number;
  genera_cuenta_default: boolean;
}

const BASE_PATH = '/conceptos';

export async function getConceptos(): Promise<Concepto[]> {
  const { data } = await api.get<Concepto[]>(BASE_PATH);
  return data;
}

export async function createConcepto(
  payload: ConceptoPayload,
): Promise<Concepto> {
  const { data } = await api.post<Concepto>(BASE_PATH, payload);
  return data;
}

export async function updateConcepto(
  clave: string,
  payload: ConceptoPayload,
): Promise<Concepto> {
  const { data } = await api.put<Concepto>(
    `${BASE_PATH}/${encodeURIComponent(clave)}`,
    payload,
  );
  return data;
}

export async function deleteConcepto(clave: string): Promise<void> {
  await api.delete(`${BASE_PATH}/${encodeURIComponent(clave)}`);
}
