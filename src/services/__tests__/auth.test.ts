import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, loginWithGoogle, loginWithMicrosoft, register } from '../auth';

vi.mock('../api', () => ({
  api: {
    post: vi.fn(),
  },
}));

const { api } = await import('../api');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('auth service', () => {
  it('login posts to /auth/login', async () => {
    const mockResponse = { data: { token: 't', user: { id_usuario: 1, username: 'test' } } };
    (api.post as any).mockResolvedValue(mockResponse);

    const result = await login('user', 'pass');

    expect(api.post).toHaveBeenCalledWith('/auth/login', { username: 'user', password: 'pass' });
    expect(result).toEqual(mockResponse.data);
  });

  it('loginWithGoogle posts to /auth/google', async () => {
    const mockResponse = { data: { token: 't', user: { id_usuario: 1 } } };
    (api.post as any).mockResolvedValue(mockResponse);

    const result = await loginWithGoogle('google-id-token');

    expect(api.post).toHaveBeenCalledWith('/auth/google', { token: 'google-id-token' });
    expect(result).toEqual(mockResponse.data);
  });

  it('loginWithMicrosoft posts to /auth/microsoft', async () => {
    const mockResponse = { data: { token: 't', user: { id_usuario: 1 } } };
    (api.post as any).mockResolvedValue(mockResponse);

    const payload = { id_token: 'ms-token' };
    const result = await loginWithMicrosoft(payload);

    expect(api.post).toHaveBeenCalledWith('/auth/microsoft', payload);
    expect(result).toEqual(mockResponse.data);
  });

  it('register posts to /auth/register', async () => {
    const mockResponse = { data: { message: 'ok' } };
    (api.post as any).mockResolvedValue(mockResponse);

    const payload = { username: 'newuser', password: 'pass' };
    const result = await register(payload);

    expect(api.post).toHaveBeenCalledWith('/auth/register', payload);
    expect(result).toEqual(mockResponse.data);
  });

  describe('error handling', () => {
    it('login throws on 401', async () => {
      const error = { response: { status: 401, data: { message: 'Credenciales inválidas' } }, isAxiosError: true };
      (api.post as any).mockRejectedValue(error);

      await expect(login('user', 'wrong')).rejects.toEqual(error);
    });

    it('login throws on network error', async () => {
      const error = new Error('Network Error');
      (api.post as any).mockRejectedValue(error);

      await expect(login('user', 'pass')).rejects.toThrow('Network Error');
    });

    it('login throws on server error', async () => {
      const error = { response: { status: 500, data: { message: 'Server error' } }, isAxiosError: true };
      (api.post as any).mockRejectedValue(error);

      await expect(login('user', 'pass')).rejects.toEqual(error);
    });

    it('loginWithMicrosoft throws on error', async () => {
      const error = { response: { status: 400, data: { message: 'Bad request' } }, isAxiosError: true };
      (api.post as any).mockRejectedValue(error);

      await expect(loginWithMicrosoft({ id_token: 'bad' })).rejects.toEqual(error);
    });
  });
});
