// src/services/ciclos.ts
import {api} from './api';

export interface Ciclo {
  id_ciclo: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  es_actual: boolean;
}

const BASE_PATH = '/ciclos-escolares';

export async function getCiclos(): Promise<Ciclo[]> {
  const { data } = await api.get<Ciclo[]>(BASE_PATH);
  return data;
}
