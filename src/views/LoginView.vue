<template>
  <div class="login-container">
    <div class="login-card g-page-animate">
      <div class="login-header">
        <div class="header-logos">
          <img src="https://upload.wikimedia.org/wikipedia/commons/9/9b/UAdeC_logo.png" alt="UAdeC" class="header-logo uadec-logo" />
          <div class="logo-divider"></div>
          <img src="https://sistemas.uadec.mx/images/logo_sistemas.png" alt="Escuela de Sistemas" class="header-logo sistemas-logo" />
        </div>
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

        <GoogleButton 
          type="submit" 
          class="login-submit-btn" 
          :loading="loadingLocal"
          :disabled="!!error && error.includes('intentos')"
        >
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
          class="sso-btn ms-btn"
          :loading="loadingMicrosoft"
          @click="startMicrosoftLogin"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" class="sso-brand-img" />
          Continuar con Microsoft
        </GoogleButton>
      </div>

      <p v-if="!googleClientId" class="sso-hint">
        Configura la variable de entorno VITE_GOOGLE_CLIENT_ID para habilitar el acceso con Google.
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
import { initializeMsal, loginPopup } from '../services/msal';

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

let googleInitialized = false;

function parseAuthError(err: unknown, fallback: string): string {
  const response = (err as any)?.response;
  const data = response?.data;
  
  const backendMessage = String(data?.message ?? data?.error ?? '').trim();
  const raw = backendMessage || (err instanceof Error ? err.message : fallback);
  const normalized = raw.toLowerCase();
  
  // Si el error es 429 (Rate Limit)
  if (response?.status === 429) {
    return data?.message || 'Demasiados intentos. Por favor, espera un momento antes de reintentar.';
  }

  // Si el error es 401 (Unauthorized) en Google Login, suele ser por falta de env vars en Render
  if (response?.status === 401 && normalized.includes('google')) {
    return 'Error de configuración en el servidor. Verifica que las variables de entorno estén configuradas en Render.';
  }

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
      use_fedcm_for_prompt: true,
      itp_support: true,
      ux_mode: 'popup',
    });
    googleInitialized = true;
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
      if (notification?.getDismissedReason?.()) {
        const reason = notification.getDismissedReason();
        if (reason === 'credential_returned') return; // Success, handled by callback
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
    const result = await loginPopup();
    const idToken = result.idToken;

    if (!idToken) {
      throw new Error('No se recibió un idToken válido de Microsoft.');
    }

    await auth.loginWithMicrosoft({ id_token: idToken });
    router.push('/inicio');
  } catch (err: any) {
    if (err.name === 'BrowserAuthError' && err.errorCode === 'user_cancelled') {
        console.warn('[MSAL] Login cancelado por el usuario.');
        return;
    }
    console.error(err);
    error.value = parseAuthError(err, 'No fue posible completar el inicio de sesión con Microsoft.');
  } finally {
    loadingMicrosoft.value = false;
  }
}

onMounted(() => {
  if (route.query.reason === 'inactive') {
    error.value = 'Tu sesion fue cerrada porque el usuario esta inactivo.';
  }

  console.log('[Auth] Google Client ID:', googleClientId);

  ensureGoogleIdentityReady()
    .then(() => console.log('[Auth] Google ready'))
    .catch((e) => console.warn('[Auth] Google init error:', e));

  initializeMsal()
    .then(() => console.log('[Auth] MSAL ready'))
    .catch((e) => console.warn('[Auth] MSAL init error:', e));
});
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top left, var(--md-sys-color-primary-container) 0%, transparent 35%),
    radial-gradient(circle at bottom right, var(--md-sys-color-surface-container) 0%, transparent 40%),
    var(--md-sys-color-background);
  padding: 1.5rem;
}

.login-card {
  background: var(--md-sys-color-surface);
  padding: 2rem;
  border-radius: 22px;
  width: 100%;
  max-width: 430px;
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--md-sys-color-outline-variant);
}

.login-header {
  margin-bottom: 2rem;
  text-align: center;
}

.header-logos {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
}

.header-logo {
  height: 60px;
  object-fit: contain;
  transition: transform 0.3s ease;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.header-logo:hover {
  transform: scale(1.05);
}

.logo-divider {
  width: 1px;
  height: 40px;
  background-color: var(--md-sys-color-outline-variant);
  opacity: 0.5;
}

.header-title {
  margin: 0;
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--md-sys-color-primary);
  letter-spacing: -0.02em;
}

.header-subtitle {
  color: var(--md-sys-color-on-surface-variant);
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
  color: var(--md-sys-color-on-error-container);
  background: var(--md-sys-color-error-container);
  border: 1px solid var(--md-sys-color-error);
  padding: 0.85rem 1rem;
  border-radius: 12px;
  font-size: 0.88rem;
}

.sso-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1.5rem 0 1.25rem;
  color: var(--md-sys-color-outline);
  font-size: 0.82rem;
}

.sso-divider::before,
.sso-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--md-sys-color-outline-variant);
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
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface);
  font-weight: 700;
  font-size: 0.8rem;
}

.sso-brand-img {
  width: 18px;
  height: 18px;
  margin-right: 2px;
}

.ms-btn:hover {
  border-color: #00a4ef55;
  background-color: #00a4ef08;
}

.sso-hint {
  margin: 1rem 0 0;
  font-size: 0.78rem;
  color: var(--md-sys-color-on-tertiary-container);
  background: var(--md-sys-color-tertiary-container);
  border: 1px solid var(--md-sys-color-outline-variant);
  padding: 0.75rem 1rem;
  border-radius: 12px;
}

.register-entry {
  margin-top: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.84rem;
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.78rem;
  color: var(--md-sys-color-outline);
}

.popup-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 1.5rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--md-sys-color-surface-container-highest);
  border-top: 3px solid var(--md-sys-color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
