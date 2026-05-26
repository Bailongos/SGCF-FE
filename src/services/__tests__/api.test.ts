import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '../api';

beforeEach(() => {
  localStorage.clear();
});

describe('API request interceptor', () => {
  it('adds Authorization header when token exists', async () => {
    localStorage.setItem('token', 'test-token');

    const interceptor = (api.interceptors.request as any).handlers[0];
    const config: any = { headers: {} };

    const result = interceptor.fulfilled(config);

    expect(result.headers.Authorization).toBe('Bearer test-token');
  });

  it('does not add Authorization header when no token', async () => {
    const interceptor = (api.interceptors.request as any).handlers[0];
    const config: any = { headers: {} };

    const result = interceptor.fulfilled(config);

    expect(result.headers.Authorization).toBeUndefined();
  });
});

describe('API response interceptor', () => {
  it('passes successful responses through', async () => {
    const interceptor = (api.interceptors.response as any).handlers[0];
    const response = { status: 200, data: { ok: true } };

    expect(interceptor.fulfilled(response)).toBe(response);
  });

  it('rejects error without redirecting on auth endpoints', async () => {
    const interceptor = (api.interceptors.response as any).handlers[0];
    const error = {
      response: { status: 401 },
      config: { url: '/auth/login' },
    };

    await expect(interceptor.rejected(error)).rejects.toBe(error);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('clears storage and redirects on 401 for non-auth endpoints', async () => {
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: '' },
      writable: true,
    });

    const interceptor = (api.interceptors.response as any).handlers[0];
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
