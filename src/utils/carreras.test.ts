import { describe, it, expect } from 'vitest';
import { formatCarreraLabel, normalizeCarreraClave, isValidCarreraClave } from './carreras';

describe('formatCarreraLabel', () => {
  it('returns "clave - nombre" when both present', () => {
    expect(formatCarreraLabel({ id_carrera: 1, clave: 'ISC', nombre: 'Ingeniería en Sistemas' }))
      .toBe('ISC - Ingeniería en Sistemas');
  });

  it('returns only clave when nombre is empty', () => {
    expect(formatCarreraLabel({ id_carrera: 1, clave: 'ISC', nombre: '' })).toBe('ISC');
    expect(formatCarreraLabel({ id_carrera: 1, clave: 'ISC', nombre: null })).toBe('ISC');
    expect(formatCarreraLabel({ id_carrera: 1, clave: 'ISC' })).toBe('ISC');
  });

  it('returns only nombre when clave is empty', () => {
    expect(formatCarreraLabel({ id_carrera: 1, clave: '', nombre: 'Ingeniería' })).toBe('Ingeniería');
    expect(formatCarreraLabel({ id_carrera: 1, clave: null, nombre: 'Ingeniería' })).toBe('Ingeniería');
  });

  it('returns "-" when null or undefined', () => {
    expect(formatCarreraLabel(null)).toBe('-');
    expect(formatCarreraLabel(undefined)).toBe('-');
  });

  it('returns fallback with id when no clave nor nombre', () => {
    expect(formatCarreraLabel({ id_carrera: 5, clave: '', nombre: '' })).toBe('Carrera 5');
    expect(formatCarreraLabel({ id_carrera: 5 })).toBe('Carrera 5');
  });

  it('returns "-" when id_carrera is null/undefined and no clave/nombre', () => {
    expect(formatCarreraLabel({ id_carrera: null, clave: '', nombre: '' })).toBe('-');
    expect(formatCarreraLabel({ id_carrera: undefined, clave: '', nombre: '' })).toBe('-');
    expect(formatCarreraLabel({ id_carrera: null })).toBe('-');
  });
});

describe('normalizeCarreraClave', () => {
  it('trims and uppercases', () => {
    expect(normalizeCarreraClave(' isc ')).toBe('ISC');
    expect(normalizeCarreraClave('Ingenieria')).toBe('INGENIERIA');
  });

  it('handles null/undefined', () => {
    expect(normalizeCarreraClave(null as any)).toBe('');
    expect(normalizeCarreraClave(undefined as any)).toBe('');
  });
});

describe('isValidCarreraClave', () => {
  it('returns true for alphanumeric with dashes', () => {
    expect(isValidCarreraClave('ISC')).toBe(true);
    expect(isValidCarreraClave('ing-2024')).toBe(true);
    expect(isValidCarreraClave('ABC123')).toBe(true);
  });

  it('returns false for invalid characters', () => {
    expect(isValidCarreraClave('IS C')).toBe(false);
    expect(isValidCarreraClave('')).toBe(false);
    expect(isValidCarreraClave('   ')).toBe(false);
  });
});
