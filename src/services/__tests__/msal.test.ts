import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockMsalInstance = {
  initialize: vi.fn(),
  handleRedirectPromise: vi.fn(),
  getAllAccounts: vi.fn(),
  setActiveAccount: vi.fn(),
  getActiveAccount: vi.fn(),
  loginPopup: vi.fn(),
  acquireTokenSilent: vi.fn(),
  acquireTokenPopup: vi.fn(),
  logoutPopup: vi.fn(),
};

class MockPublicClientApplication {
  constructor(_config: any) {}
  initialize = mockMsalInstance.initialize;
  handleRedirectPromise = mockMsalInstance.handleRedirectPromise;
  getAllAccounts = mockMsalInstance.getAllAccounts;
  setActiveAccount = mockMsalInstance.setActiveAccount;
  getActiveAccount = mockMsalInstance.getActiveAccount;
  loginPopup = mockMsalInstance.loginPopup;
  acquireTokenSilent = mockMsalInstance.acquireTokenSilent;
  acquireTokenPopup = mockMsalInstance.acquireTokenPopup;
  logoutPopup = mockMsalInstance.logoutPopup;
}

vi.mock('@azure/msal-browser', () => ({
  PublicClientApplication: MockPublicClientApplication,
  LogLevel: { Error: 1, Warning: 2, Info: 3, Verbose: 4 },
  InteractionRequiredAuthError: class extends Error {
    constructor() {
      super('Interaction required');
      this.name = 'InteractionRequiredAuthError';
    }
  },
  BrowserAuthError: class extends Error {
    public errorCode: string;
    constructor(errorCode: string, message: string) {
      super(message);
      this.errorCode = errorCode;
      this.name = 'BrowserAuthError';
    }
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('MSAL service', () => {
  it('initializes MSAL and skips re-initialization', async () => {
    mockMsalInstance.initialize.mockResolvedValue(undefined);
    mockMsalInstance.handleRedirectPromise.mockResolvedValue(null);
    mockMsalInstance.getAllAccounts.mockReturnValue([]);

    const { initializeMsal } = await import('../msal');
    await initializeMsal();
    expect(mockMsalInstance.initialize).toHaveBeenCalledTimes(1);
    expect(mockMsalInstance.handleRedirectPromise).toHaveBeenCalledTimes(1);

    await initializeMsal();
    expect(mockMsalInstance.initialize).toHaveBeenCalledTimes(1);
  });

  it('returns null for getToken when no active account', async () => {
    mockMsalInstance.initialize.mockResolvedValue(undefined);
    mockMsalInstance.handleRedirectPromise.mockResolvedValue(null);
    mockMsalInstance.getAllAccounts.mockReturnValue([]);
    mockMsalInstance.getActiveAccount.mockReturnValue(null);

    const { getToken } = await import('../msal');
    const result = await getToken();

    expect(result).toBeNull();
  });

  it('acquires token silently when account exists', async () => {
    mockMsalInstance.initialize.mockResolvedValue(undefined);
    mockMsalInstance.handleRedirectPromise.mockResolvedValue(null);
    mockMsalInstance.getAllAccounts.mockReturnValue([]);
    mockMsalInstance.getActiveAccount.mockReturnValue({ username: 'test@test.com' });
    mockMsalInstance.acquireTokenSilent.mockResolvedValue({ idToken: 'id-token' });

    const { getToken } = await import('../msal');
    const result = await getToken();

    expect(result).toBe('id-token');
    expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalledTimes(1);
  });

  it('loginPopup calls initialize and loginPopup on msalInstance', async () => {
    mockMsalInstance.initialize.mockResolvedValue(undefined);
    mockMsalInstance.handleRedirectPromise.mockResolvedValue(null);
    mockMsalInstance.getAllAccounts.mockReturnValue([]);
    mockMsalInstance.loginPopup.mockResolvedValue({ account: { username: 'test@test.com' }, idToken: 'id-token' });

    const { loginPopup } = await import('../msal');
    const result = await loginPopup();

    expect(mockMsalInstance.initialize).toHaveBeenCalled();
    expect(mockMsalInstance.loginPopup).toHaveBeenCalled();
    expect(mockMsalInstance.setActiveAccount).toHaveBeenCalledWith({ username: 'test@test.com' });
    expect(result.idToken).toBe('id-token');
  });

  it('loginPopup throws on interaction_in_progress error', async () => {
    mockMsalInstance.initialize.mockResolvedValue(undefined);
    mockMsalInstance.handleRedirectPromise.mockResolvedValue(null);
    mockMsalInstance.getAllAccounts.mockReturnValue([]);
    const { BrowserAuthError } = await import('@azure/msal-browser');
    const error = new (BrowserAuthError as any)('interaction_in_progress', 'Interaction in progress');
    mockMsalInstance.loginPopup.mockRejectedValue(error);

    const { loginPopup } = await import('../msal');
    await expect(loginPopup()).rejects.toThrow('Interaction in progress');
  });

  it('loginPopup throws on user_cancelled error', async () => {
    mockMsalInstance.initialize.mockResolvedValue(undefined);
    mockMsalInstance.handleRedirectPromise.mockResolvedValue(null);
    mockMsalInstance.getAllAccounts.mockReturnValue([]);
    const { BrowserAuthError } = await import('@azure/msal-browser');
    const error = new (BrowserAuthError as any)('user_cancelled', 'User cancelled');
    mockMsalInstance.loginPopup.mockRejectedValue(error);

    const { loginPopup } = await import('../msal');
    await expect(loginPopup()).rejects.toThrow('User cancelled');
  });

  it('getToken falls back to popup on InteractionRequiredAuthError', async () => {
    mockMsalInstance.initialize.mockResolvedValue(undefined);
    mockMsalInstance.handleRedirectPromise.mockResolvedValue(null);
    mockMsalInstance.getAllAccounts.mockReturnValue([]);
    mockMsalInstance.getActiveAccount.mockReturnValue({ username: 'test@test.com' });
    const { InteractionRequiredAuthError } = await import('@azure/msal-browser');
    mockMsalInstance.acquireTokenSilent.mockRejectedValue(new (InteractionRequiredAuthError as any)());
    mockMsalInstance.acquireTokenPopup.mockResolvedValue({ idToken: 'popup-token' });

    const { getToken } = await import('../msal');
    const result = await getToken();

    expect(result).toBe('popup-token');
    expect(mockMsalInstance.acquireTokenSilent).toHaveBeenCalledTimes(1);
    expect(mockMsalInstance.acquireTokenPopup).toHaveBeenCalledTimes(1);
  });

  it('getToken returns null on non-InteractionRequiredAuthError', async () => {
    mockMsalInstance.initialize.mockResolvedValue(undefined);
    mockMsalInstance.handleRedirectPromise.mockResolvedValue(null);
    mockMsalInstance.getAllAccounts.mockReturnValue([]);
    mockMsalInstance.getActiveAccount.mockReturnValue({ username: 'test@test.com' });
    mockMsalInstance.acquireTokenSilent.mockRejectedValue(new Error('Other error'));

    const { getToken } = await import('../msal');
    const result = await getToken();

    expect(result).toBeNull();
  });

  it('logoutMsal calls logoutPopup when account exists', async () => {
    mockMsalInstance.initialize.mockResolvedValue(undefined);
    mockMsalInstance.handleRedirectPromise.mockResolvedValue(null);
    mockMsalInstance.getAllAccounts.mockReturnValue([]);
    mockMsalInstance.getActiveAccount.mockReturnValue({ username: 'test@test.com' });
    mockMsalInstance.logoutPopup.mockResolvedValue(undefined);

    const { logoutMsal } = await import('../msal');
    await logoutMsal();

    expect(mockMsalInstance.logoutPopup).toHaveBeenCalledTimes(1);
  });

  it('logoutMsal skips logout when no active account', async () => {
    mockMsalInstance.initialize.mockResolvedValue(undefined);
    mockMsalInstance.handleRedirectPromise.mockResolvedValue(null);
    mockMsalInstance.getAllAccounts.mockReturnValue([]);
    mockMsalInstance.getActiveAccount.mockReturnValue(null);

    const { logoutMsal } = await import('../msal');
    await logoutMsal();

    expect(mockMsalInstance.logoutPopup).not.toHaveBeenCalled();
  });
});
