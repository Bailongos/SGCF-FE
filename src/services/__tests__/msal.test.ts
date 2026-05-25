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
});
