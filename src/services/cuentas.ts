// src/services/cuentas.ts
import { api } from './api';

// Sólo estos dos conceptos por ahora
export type ConceptoCuenta = 'UADEC' | 'ESCUELA';

export interface Cuenta {
  id_cuenta: number;
  matricula: string;
  concepto: ConceptoCuenta;
  id_ciclo: number;
  monto: number;
  pagado: boolean;
  fecha_pago: string | null;
  fecha_creacion: string;
  id_metodo: number | null; // 👈 nuevo
}

export interface CuentaPayload {
  matricula: string;
  concepto: ConceptoCuenta;
  id_ciclo: number;
  monto: number;
  pagado: boolean;
  fecha_pago?: string | null;
  id_metodo?: number | null; // 👈 nuevo
}

// Coincide con el backend:
// AppRoutes -> app.register(cuentasRoutes, { prefix: '/api/cuentas' });
const BASE_PATH = '/cuentas';

export async function getCuentas(): Promise<Cuenta[]> {
  const { data } = await api.get<Cuenta[]>(BASE_PATH);
  return data;
}

export async function createCuenta(payload: CuentaPayload): Promise<Cuenta> {
  const { data } = await api.post<Cuenta>(BASE_PATH, payload);
  return data;
}

export async function updateCuenta(
  id_cuenta: number,
  payload: CuentaPayload,
): Promise<Cuenta> {
  const { data } = await api.put<Cuenta>(`${BASE_PATH}/${id_cuenta}`, payload);
  return data;
}

export async function deleteCuenta(id_cuenta: number): Promise<void> {
  await api.delete(`${BASE_PATH}/${id_cuenta}`);
}
