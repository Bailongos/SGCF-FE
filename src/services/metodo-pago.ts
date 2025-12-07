// src/services/metodos-pago.ts
import { api } from './api';

export interface MetodoPago {
  id_metodo: number;
  nombre: string;
}

export interface MetodoPagoPayload {
  nombre: string;
}

// Coincide con el backend:
// AppRoutes -> app.register(metodosPagoRoutes, { prefix: '/api/metodos-pago' });
const BASE_PATH = '/metodos-pago';

export async function getMetodosPago(): Promise<MetodoPago[]> {
  const { data } = await api.get<MetodoPago[]>(BASE_PATH);
  return data;
}

export async function createMetodoPago(
  payload: MetodoPagoPayload,
): Promise<MetodoPago> {
  const { data } = await api.post<MetodoPago>(BASE_PATH, payload);
  return data;
}

export async function updateMetodoPago(
  id_metodo: number,
  payload: MetodoPagoPayload,
): Promise<MetodoPago> {
  const { data } = await api.put<MetodoPago>(`${BASE_PATH}/${id_metodo}`, payload);
  return data;
}

export async function deleteMetodoPago(id_metodo: number): Promise<void> {
  await api.delete(`${BASE_PATH}/${id_metodo}`);
}
