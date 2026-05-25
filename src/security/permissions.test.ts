import { describe, it, expect } from 'vitest';
import { getRolePermissionSet, PERMISSIONS } from './permissions';

describe('getRolePermissionSet', () => {
  it('returns all permissions for administrador', () => {
    const result = getRolePermissionSet('administrador');
    expect(result.has('*')).toBe(true);
    expect(result.size).toBe(Object.values(PERMISSIONS).length + 1);
  });

  it('returns all permissions for administrador with whitespace and case variations', () => {
    expect(getRolePermissionSet(' ADMINISTRADOR ').has('*')).toBe(true);
    expect(getRolePermissionSet('Administrador').has('*')).toBe(true);
  });

  it('returns coordinador permissions', () => {
    const result = getRolePermissionSet('coordinador');
    expect(result.has(PERMISSIONS.VIEW_INICIO)).toBe(true);
    expect(result.has(PERMISSIONS.VIEW_ALUMNOS)).toBe(true);
    expect(result.has(PERMISSIONS.VIEW_CUENTAS)).toBe(true);
    expect(result.has(PERMISSIONS.VIEW_OBSERVACIONES)).toBe(true);
    expect(result.has(PERMISSIONS.ACTION_ALUMNO_CREATE)).toBe(true);
    expect(result.has(PERMISSIONS.FILTER_CARRERA_CHANGE)).toBe(true);
    expect(result.has(PERMISSIONS.VIEW_CARRERAS)).toBe(false);
    expect(result.has(PERMISSIONS.VIEW_ROLES)).toBe(false);
  });

  it('returns caja permissions', () => {
    const result = getRolePermissionSet('caja');
    expect(result.has(PERMISSIONS.VIEW_INICIO)).toBe(true);
    expect(result.has(PERMISSIONS.VIEW_CUENTAS)).toBe(true);
    expect(result.has(PERMISSIONS.VIEW_CONCEPTOS)).toBe(true);
    expect(result.has(PERMISSIONS.VIEW_METODOS_PAGO)).toBe(true);
    expect(result.has(PERMISSIONS.ACTION_CUENTA_CREATE)).toBe(true);
    expect(result.has(PERMISSIONS.VIEW_ALUMNOS)).toBe(false);
  });

  it('returns pendiente permissions', () => {
    const result = getRolePermissionSet('pendiente');
    expect(result.has(PERMISSIONS.VIEW_INICIO)).toBe(true);
    expect(result.has(PERMISSIONS.VIEW_ALUMNOS)).toBe(false);
    expect(result.has(PERMISSIONS.VIEW_ADMIN_USUARIOS)).toBe(false);
  });

  it('returns sin rol permissions', () => {
    const result = getRolePermissionSet('sin rol');
    expect(result.has(PERMISSIONS.VIEW_INICIO)).toBe(true);
    expect(result.has(PERMISSIONS.VIEW_CUENTAS)).toBe(false);
  });

  it('returns empty set for empty string role', () => {
    const result = getRolePermissionSet('');
    expect(result.size).toBe(0);
  });

  it('returns empty set for unknown role', () => {
    const result = getRolePermissionSet('unknown_role');
    expect(result.size).toBe(0);
  });

  it('returns empty set for null/undefined', () => {
    expect(getRolePermissionSet(null as any).size).toBe(0);
    expect(getRolePermissionSet(undefined as any).size).toBe(0);
  });
});
