// src/services/alumnos.ts
import { api } from './api.ts';

export interface Alumno {
  matricula: string;
  nombre_completo: string;
  email_institucional: string | null;
  telefono_contacto: string | null;
  id_carrera: number;
  semestre_actual: number;
  activo: boolean;
  fecha_registro: string;
}

export interface AlumnoCreate {
  matricula: string;
  nombre_completo: string;
  email_institucional?: string;
  telefono_contacto?: string;
  id_carrera: number;
  semestre_actual?: number;
  activo?: boolean;
}

export async function getAlumnos(): Promise<Alumno[]> {
  const { data } = await api.get<Alumno[]>('/alumnos');
  return data;
}

export async function createAlumno(payload: AlumnoCreate): Promise<Alumno> {
  const { data } = await api.post<Alumno>('/alumnos', payload);
  return data;
}

export async function updateAlumno(
  matricula: string,
  payload: Partial<AlumnoCreate>,
): Promise<Alumno> {
  const { data } = await api.put<Alumno>(`/alumnos/${matricula}`, payload);
  return data;
}

export async function deleteAlumno(matricula: string): Promise<void> {
  await api.delete(`/alumnos/${matricula}`);
}
