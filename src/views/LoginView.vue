<template>
  <div class="login-container">
    <div class="login-card g-page-animate">
      <div class="login-header">
        <h1 class="header-title">SGCF</h1>
        <p class="header-subtitle">Acceso al sistema</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <GoogleInput v-model="username" label="Usuario" placeholder="Ej: admin" required autofocus />

        <GoogleInput v-model="password" label="Contrasena" type="password" placeholder="••••••••" required />

        <div v-if="error" class="error-box">
          <span class="material-symbols-outlined">error</span>
          <span>{{ error }}</span>
        </div>

        <GoogleButton type="submit" class="login-submit-btn" :loading="loadingLocal" color="#1a73e8">
          Iniciar sesion
        </GoogleButton>
      </form>

      <div class="sso-divider">
        <span>o continua con</span>
      </div>

      <div class="sso-buttons">
        <GoogleButton
          type="button"
          variant="outlined"
          class="sso-btn"
          :loading="loadingGoogle"
          @click="startGoogleLogin"
        >
          <span class="sso-brand">G</span>
          Continuar con Google
        </GoogleButton>

        <GoogleButton
          type="button"
          variant="outlined"
          class="sso-btn"
          :loading="loadingMicrosoft"
          @click="startMicrosoftLogin"
        >
          <span class="sso-brand">M</span>
          Continuar con Microsoft
        </GoogleButton>
      </div>

      <p v-if="!googleClientId || !microsoftClientId" class="sso-hint">
        Configura las variables de entorno de SSO para habilitar ambos accesos.
      </p>

      <div class="register-entry">
        <span>¿No tienes cuenta?</span>
        <RouterLink to="/registro" custom v-slot="{ navigate }">
          <GoogleButton type="button" variant="text" @click="navigate">
            Registrarme
          </GoogleButton>
        </RouterLink>
      </div>

      <div class="login-footer">
        <p>© 2026 Sistema Gestor de Control Financiero</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import GoogleInput from '../components/ui/input.vue';
import GoogleButton from '../components/ui/button.vue';

const username = ref('');
const password = ref('');

const loadingLocal = ref(false);
const loadingGoogle = ref(false);
const loadingMicrosoft = ref(false);

const error = ref<string | null>(null);

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const googleClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();
const microsoftClientId = String(import.meta.env.VITE_MSAL_CLIENT_ID ?? '').trim();
const microsoftTenantId = String(import.meta.env.VITE_MSAL_TENANT_ID ?? 'common').trim();

let googleInitialized = false;
let msalClient: any = null;

function parseAuthError(err: unknown, fallback: string): string {
  const data = (err as any)?.response?.data;
  const backendMessage = String(data?.message ?? data?.error ?? '').trim();
  const raw = backendMessage || (err instanceof Error ? err.message : fallback);
  const normalized = raw.toLowerCase();

  if (normalized.includes('pending') || normalized.includes('pendiente')) {
    return 'Tu usuario esta pendiente de activacion. Contacta a un administrador.';
  }

  if (normalized.includes('inactive') || normalized.includes('inactivo') || normalized.includes('disabled')) {
    return 'Tu usuario esta inactivo. Solicita activacion al administrador.';
  }

  if (normalized.includes('token')) {
    return 'No se pudo validar el token de acceso. Intenta nuevamente.';
  }

  return raw;
}

async function loadScriptOnce(id: string, src: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null;

  if (existing) {
    if (existing.dataset.loaded === 'true') return;

    await new Promise<void>((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`No se pudo cargar script: ${src}`)), { once: true });
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`No se pudo cargar script: ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureGoogleIdentityReady() {
  if (!googleClientId) {
    throw new Error('Falta VITE_GOOGLE_CLIENT_ID.');
  }

  await loadScriptOnce('google-gsi-client', 'https://accounts.google.com/gsi/client');

  const win = window as any;
  if (!win.google?.accounts?.id) {
    throw new Error('Google Identity Services no esta disponible.');
  }

  if (!googleInitialized) {
    win.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    googleInitialized = true;
  }
}

async function ensureMicrosoftReady() {
  if (!microsoftClientId) {
    throw new Error('Falta VITE_MSAL_CLIENT_ID.');
  }

  await loadScriptOnce(
    'msal-browser-client',
    'https://alcdn.msauth.net/browser/2.39.0/js/msal-browser.min.js',
  );

  const win = window as any;
  if (!win.msal?.PublicClientApplication) {
    throw new Error('MSAL no esta disponible.');
  }

  if (!msalClient) {
    msalClient = new win.msal.PublicClientApplication({
      auth: {
        clientId: microsoftClientId,
        authority: `https://login.microsoftonline.com/${microsoftTenantId || 'common'}`,
        redirectUri: window.location.origin + '/login',
      },
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false,
      },
    });

    if (typeof msalClient.initialize === 'function') {
      await msalClient.initialize();
    }
  }
}

async function handleLogin() {
  if (!username.value || !password.value) return;

  loadingLocal.value = true;
  error.value = null;

  try {
    await auth.login(username.value, password.value);
    router.push('/inicio');
  } catch (err) {
    console.error(err);
    error.value = parseAuthError(err, 'Usuario o contrasena incorrectos.');
  } finally {
    loadingLocal.value = false;
  }
}

function handleGoogleCredential(response: { credential?: string }) {
  const idToken = String(response?.credential ?? '');
  if (!idToken) {
    loadingGoogle.value = false;
    error.value = 'Google no devolvio un token valido.';
    return;
  }

  void (async () => {
    try {
      await auth.loginWithGoogle(idToken);
      router.push('/inicio');
    } catch (err) {
      console.error(err);
      error.value = parseAuthError(err, 'No fue posible iniciar sesion con Google.');
    } finally {
      loadingGoogle.value = false;
    }
  })();
}

async function startGoogleLogin() {
  loadingGoogle.value = true;
  error.value = null;

  try {
    await ensureGoogleIdentityReady();

    const win = window as any;
    win.google.accounts.id.prompt((notification: any) => {
      if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
        loadingGoogle.value = false;
        error.value =
          'No se pudo abrir Google Sign-In. Verifica popups o intenta nuevamente.';
      }
    });

    window.setTimeout(() => {
      if (loadingGoogle.value) {
        loadingGoogle.value = false;
      }
    }, 10000);
  } catch (err) {
    console.error(err);
    loadingGoogle.value = false;
    error.value = parseAuthError(err, 'No fue posible inicializar Google Sign-In.');
  }
}

async function startMicrosoftLogin() {
  loadingMicrosoft.value = true;
  error.value = null;

  try {
    await ensureMicrosoftReady();

    const result = await msalClient.loginPopup({
      scopes: ['openid', 'profile', 'email'],
      prompt: 'select_account',
    });

    const idToken = String(result?.idToken ?? '');
    if (!idToken) {
      throw new Error('Microsoft no devolvio id_token.');
    }

    await auth.loginWithMicrosoft({ id_token: idToken });
    router.push('/inicio');
  } catch (err) {
    console.error(err);
    error.value = parseAuthError(err, 'No fue posible iniciar sesion con Microsoft.');
  } finally {
    loadingMicrosoft.value = false;
  }
}

onMounted(() => {
  if (route.query.reason === 'inactive') {
    error.value = 'Tu sesion fue cerrada porque el usuario esta inactivo.';
  }

  void ensureGoogleIdentityReady().catch(() => undefined);
  void ensureMicrosoftReady().catch(() => undefined);
});
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top left, #e8f0fe 0%, transparent 35%),
    radial-gradient(circle at bottom right, #fef7e0 0%, transparent 40%),
    #f8f9fa;
  padding: 1.5rem;
}

.login-card {
  background: #fff;
  padding: 2rem;
  border-radius: 22px;
  width: 100%;
  max-width: 430px;
  box-shadow: 0 14px 35px rgba(32, 33, 36, 0.12);
  border: 1px solid #e8eaed;
}

.login-header {
  text-align: center;
  margin-bottom: 1.6rem;
}

.header-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a73e8;
  margin-bottom: 0.35rem;
}

.header-subtitle {
  color: #5f6368;
  font-size: 1rem;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.login-submit-btn {
  width: 100%;
  margin-top: 0.35rem;
}

.error-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #b3261e;
  background: #fdeceb;
  border: 1px solid #f6c8c4;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  font-size: 0.88rem;
}

.sso-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1.1rem 0 0.9rem;
  color: #80868b;
  font-size: 0.82rem;
}

.sso-divider::before,
.sso-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e0e3e7;
}

.sso-divider span {
  margin: 0 0.65rem;
}

.sso-buttons {
  display: grid;
  gap: 0.65rem;
}

.sso-btn {
  width: 100%;
  justify-content: flex-start;
  border-radius: 10px;
  padding-left: 0.85rem;
}

.sso-brand {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f1f3f4;
  color: #202124;
  font-weight: 700;
  font-size: 0.76rem;
}

.sso-hint {
  margin: 0.7rem 0 0;
  font-size: 0.78rem;
  color: #8a6100;
  background: #fef7e0;
  border: 1px solid #f3de98;
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
}

.register-entry {
  margin-top: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  color: #5f6368;
  font-size: 0.84rem;
}

.login-footer {
  margin-top: 1.8rem;
  text-align: center;
  font-size: 0.78rem;
  color: #80868b;
}

.g-page-animate {
  animation: g-fade-in 180ms ease-out;
}

@keyframes g-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
