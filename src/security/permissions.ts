export const PERMISSIONS = {
  VIEW_INICIO: 'view.inicio',
  VIEW_ALUMNOS: 'view.alumnos',
  VIEW_DASHBOARD_ALUMNOS: 'view.dashboard.alumnos',
  VIEW_CARRERAS: 'view.carreras',
  VIEW_CUENTAS: 'view.cuentas',
  VIEW_METODOS_PAGO: 'view.metodos_pago',
  VIEW_CICLOS: 'view.ciclos_escolares',
  VIEW_ADMIN_USUARIOS: 'view.admin.usuarios_permisos',
  VIEW_ROLES: 'view.roles',
  VIEW_OBSERVACIONES: 'view.observaciones',
  VIEW_CONCEPTOS: 'view.conceptos',
  ACTION_ALUMNO_CREATE: 'action.alumno.create',
  ACTION_CUENTA_CREATE: 'action.cuenta.create',
  ACTION_MANAGE_CATALOGS: 'action.catalogos.manage',
  FILTER_CARRERA_CHANGE: 'filters.carrera.change',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

type RolePermissionPreset = PermissionKey[] | '*';

const ROLE_PERMISSIONS: Record<string, RolePermissionPreset> = {
  administrador: '*',
  coordinador: [
    PERMISSIONS.VIEW_INICIO,
    PERMISSIONS.VIEW_ALUMNOS,
    PERMISSIONS.VIEW_DASHBOARD_ALUMNOS,
    PERMISSIONS.VIEW_CUENTAS,
    PERMISSIONS.VIEW_OBSERVACIONES,
    PERMISSIONS.ACTION_ALUMNO_CREATE,
    PERMISSIONS.ACTION_CUENTA_CREATE,
    PERMISSIONS.FILTER_CARRERA_CHANGE,
  ],
  caja: [
    PERMISSIONS.VIEW_INICIO,
    PERMISSIONS.VIEW_CUENTAS,
    PERMISSIONS.VIEW_CONCEPTOS,
    PERMISSIONS.VIEW_METODOS_PAGO,
    PERMISSIONS.ACTION_CUENTA_CREATE,
  ],
  pendiente: [
    PERMISSIONS.VIEW_INICIO,
  ],
  'sin rol': [
    PERMISSIONS.VIEW_INICIO,
  ],
  '': [],
};

export function getRolePermissionSet(roleName: string): Set<string> {
  const normalizedRole = String(roleName ?? '').trim().toLowerCase();
  const preset = ROLE_PERMISSIONS[normalizedRole] ?? [];

  if (preset === '*') {
    return new Set(['*', ...ALL_PERMISSIONS]);
  }

  return new Set(preset);
}
