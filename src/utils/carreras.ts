export interface CarreraLabelSource {
  id_carrera?: number | string | null;
  clave?: string | null;
  nombre?: string | null;
}

export const CARRERA_CLAVE_REGEX = /^[A-Za-z0-9-]+$/;

export function normalizeCarreraClave(clave: string): string {
  return String(clave ?? '').trim().toUpperCase();
}

export function isValidCarreraClave(clave: string): boolean {
  return CARRERA_CLAVE_REGEX.test(clave);
}

export function formatCarreraLabel(carrera: CarreraLabelSource | null | undefined): string {
  if (!carrera) return '-';

  const clave = String(carrera.clave ?? '').trim();
  const nombre = String(carrera.nombre ?? '').trim();

  if (clave && nombre) return `${clave} - ${nombre}`;
  if (clave) return clave;
  if (nombre) return nombre;

  if (carrera.id_carrera === null || carrera.id_carrera === undefined || carrera.id_carrera === '') {
    return '-';
  }

  return `Carrera ${carrera.id_carrera}`;
}
