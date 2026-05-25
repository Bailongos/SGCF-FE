// src/services/msal.ts
import { 
  PublicClientApplication, 
  type Configuration, 
  LogLevel, 
  type AuthenticationResult,
  type SilentRequest,
  type PopupRequest,
  InteractionRequiredAuthError,
  BrowserAuthError
} from "@azure/msal-browser";

/**
 * CONFIGURACIÓN DE MSAL (M Microsoft Authentication Library)
 * Sigue las mejores prácticas para aplicaciones de página única (SPA).
 */
const clientId = import.meta.env.VITE_MSAL_CLIENT_ID || '';
const tenantId = import.meta.env.VITE_MSAL_TENANT_ID || '';

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin + '/login',
    postLogoutRedirectUri: window.location.origin + '/',
  },
  cache: {
    cacheLocation: "localStorage", // Se recomienda localStorage para persistencia tras refresh
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error: console.error('[MSAL Error]', message); return;
          case LogLevel.Warning: console.warn('[MSAL Warning]', message); return;
          case LogLevel.Info: console.info('[MSAL Info]', message); return;
          case LogLevel.Verbose: console.debug('[MSAL Verbose]', message); return;
        }
      },
    },
  },
};

// Ámbitos requeridos para el acceso básico y OIDC
export const loginRequest: PopupRequest = {
  scopes: ["openid", "profile", "User.Read", "offline_access"],
};

// Instancia única global de MSAL
export const msalInstance = new PublicClientApplication(msalConfig);

let isMsalInitialized = false;

/**
 * INICIALIZACIÓN CRÍTICA
 * Debe completarse antes de cualquier interacción con el usuario.
 */
export async function initializeMsal(): Promise<void> {
  if (isMsalInitialized) return;

  try {
    await msalInstance.initialize();
    
    // handleRedirectPromise es vital para limpiar estados tras popups/redirects
    const result = await msalInstance.handleRedirectPromise();
    
    if (result) {
      msalInstance.setActiveAccount(result.account);
    } else {
      // Si no hay resultado de redirección, buscamos cuentas existentes en caché
      const currentAccounts = msalInstance.getAllAccounts();
      if (currentAccounts.length > 0) {
        msalInstance.setActiveAccount(currentAccounts[0] || null);
      }
    }
    
    isMsalInitialized = true;
    console.log('[MSAL] Inicializado y listo.');
  } catch (error) {
    console.error('[MSAL] Falló la inicialización:', error);
    throw error;
  }
}

/**
 * LOGIN INTERACTIVO (Popup)
 * Implementa el manejo de errores para evitar 'interaction_in_progress'.
 */
export async function loginPopup(): Promise<AuthenticationResult> {
  await initializeMsal();

  try {
    const result = await msalInstance.loginPopup(loginRequest);
    msalInstance.setActiveAccount(result.account);
    return result;
  } catch (error) {
    if (error instanceof BrowserAuthError) {
      if (error.errorCode === "interaction_in_progress") {
        console.warn("[MSAL] Ya hay una interacción en curso. No se puede abrir otra.");
      } else if (error.errorCode === "user_cancelled") {
        console.info("[MSAL] El usuario canceló la ventana emergente.");
      }
    }
    throw error;
  }
}

/**
 * ADQUISICIÓN DE TOKEN SILENCIOSA
 * Intenta obtener el token desde la caché. Si falla, solicita interacción.
 */
export async function getToken(): Promise<string | null> {
  await initializeMsal();
  
  const account = msalInstance.getActiveAccount();
  if (!account) return null;

  const silentRequest: SilentRequest = {
    ...loginRequest,
    account: account,
  };

  try {
    const result = await msalInstance.acquireTokenSilent(silentRequest);
    return result.idToken; // Devolvemos el ID Token para que el backend lo valide
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Si falla el flujo silencioso, el usuario debe interactuar de nuevo
      const result = await msalInstance.acquireTokenPopup(loginRequest);
      return result.idToken;
    }
    console.error("[MSAL] Error adquiriendo token:", error);
    return null;
  }
}

/**
 * LOGOUT
 * Cierra la sesión tanto localmente como en los servidores de Microsoft.
 */
export async function logoutMsal(): Promise<void> {
  const account = msalInstance.getActiveAccount();
  if (account) {
    await msalInstance.logoutPopup({
      account: account,
      postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri,
    });
  }
}
