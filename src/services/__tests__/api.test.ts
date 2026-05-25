import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '../api';

beforeEach(() => {
  localStorage.clear();
});

describe('API request interceptor', () => {
  it('adds Authorization header when token exists', async () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id_usuario: 1, id_carrera: 2 }));

    const interceptor = api.interceptors.request.handlers[0];
    const config: any = { headers: {} };

    const result = interceptor.fulfilled(config);

    expect(result.headers.Authorization).toBe('Bearer test-token');
    expect(result.headers['x-user-id']).toBe('1');
    expect(result.headers['x-user-carrera']).toBe('2');
  });

  it('falls back to 0 for userId and carreraId when no token', async () => {
    const interceptor = api.interceptors.request.handlers[0];
    const config: any = { headers: {} };

    const result = interceptor.fulfilled(config);

    expect(result.headers.Authorization).toBeUndefined();
    expect(result.headers['x-user-id']).toBe('0');
    expect(result.headers['x-user-carrera']).toBe('0');
  });

  it('reads userId from token payload when not in localStorage user', async () => {
    const tokenPayload = { id_usuario: 42, id_carrera: 7 };
    const token = 'header.' + btoa(JSON.stringify(tokenPayload)) + '.signature';
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ username: 'test' }));

    const interceptor = api.interceptors.request.handlers[0];
    const config: any = { headers: {} };

    const result = interceptor.fulfilled(config);

    expect(result.headers['x-user-id']).toBe('42');
    expect(result.headers['x-user-carrera']).toBe('7');
  });
});

describe('API response interceptor', () => {
  it('passes successful responses through', async () => {
    const interceptor = api.interceptors.response.handlers[0];
    const response = { status: 200, data: { ok: true } };

    expect(interceptor.fulfilled(response)).toBe(response);
  });

  it('rejects error without redirecting on auth endpoints', async () => {
    const interceptor = api.interceptors.response.handlers[0];
    const error = {
      response: { status: 401 },
      config: { url: '/auth/login' },
    };

    await expect(interceptor.rejected(error)).rejects.toBe(error);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('clears storage and redirects on 401 for non-auth endpoints', async () => {
    const originalLocation = window.location;
    const mockHref = '';
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: mockHref, set href(v: string) { /* noop */ } },
      writable: true,
    });

    const interceptor = api.interceptors.response.handlers[0];
    const error = {
      response: { status: 401 },
      config: { url: '/alumnos' },
    };

    localStorage.setItem('token', 'some-token');
    localStorage.setItem('user', '{}');

    await expect(interceptor.rejected(error)).rejects.toBe(error);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
