import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginWithMicrosoftROPC } from '../microsoftAuth';

const mockPost = vi.fn();
const mockIsAxiosError = vi.fn();

vi.mock('axios', () => ({
  default: {
    post: (...args: any[]) => mockPost(...args),
    isAxiosError: (error: any) => mockIsAxiosError(error),
  },
  AxiosError: class extends Error {
    constructor(msg: string, ...args: any[]) {
      super(msg);
    }
  },
  isAxiosError: (error: any) => mockIsAxiosError(error),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loginWithMicrosoftROPC', () => {
  const tenant = 'test-tenant';
  const clientId = 'test-client';
  const username = 'user@test.com';
  const password = 'pass123';

  function makeAxiosError(status: number, data: any): Error {
    const err = new Error('Request failed') as any;
    err.isAxiosError = true;
    err.response = { status, data };
    mockIsAxiosError.mockReturnValue(true);
    return err;
  }

  it('sends correct ROPC request', async () => {
    const mockResponse = {
      data: {
        token_type: 'Bearer',
        expires_in: 3600,
        ext_expires_in: 3600,
        access_token: 'access-token',
        id_token: 'id-token',
        refresh_token: 'refresh-token',
        scope: 'openid profile',
      },
    };
    mockPost.mockResolvedValue(mockResponse);

    const result = await loginWithMicrosoftROPC(tenant, clientId, username, password);

    expect(mockPost).toHaveBeenCalledWith(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      expect.any(URLSearchParams),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const params = mockPost.mock.calls[0][1] as URLSearchParams;
    expect(params.get('client_id')).toBe(clientId);
    expect(params.get('grant_type')).toBe('password');
    expect(params.get('username')).toBe(username);
    expect(params.get('password')).toBe(password);
    expect(params.get('scope')).toBe('openid profile offline_access');

    expect(result).toEqual(mockResponse.data);
  });

  it('appends client_secret when provided', async () => {
    mockPost.mockResolvedValue({ data: { token_type: 'Bearer', expires_in: 3600, ext_expires_in: 3600, access_token: 'at', scope: 'openid' } });

    await loginWithMicrosoftROPC(tenant, clientId, username, password, 'openid', 'secret');

    const params = mockPost.mock.calls[0][1] as URLSearchParams;
    expect(params.get('client_secret')).toBe('secret');
  });

  it('throws formatted error on invalid_grant', async () => {
    const axiosError = makeAxiosError(400, {
      error: 'invalid_grant',
      error_description: 'User credentials are invalid',
    });
    mockPost.mockRejectedValue(axiosError);

    await expect(
      loginWithMicrosoftROPC(tenant, clientId, username, password),
    ).rejects.toThrow('Error de autenticación (invalid_grant): User credentials are invalid');
  });

  it('throws formatted error on invalid_request', async () => {
    const axiosError = makeAxiosError(400, {
      error: 'invalid_request',
      error_description: 'Malformed request',
    });
    mockPost.mockRejectedValue(axiosError);

    await expect(
      loginWithMicrosoftROPC(tenant, clientId, username, password),
    ).rejects.toThrow('Solicitud mal formada (invalid_request): Malformed request');
  });

  it('re-throws non-axios errors', async () => {
    const error = new Error('Network failure');
    mockIsAxiosError.mockReturnValue(false);
    mockPost.mockRejectedValue(error);

    await expect(
      loginWithMicrosoftROPC(tenant, clientId, username, password),
    ).rejects.toThrow('Network failure');
  });
});
