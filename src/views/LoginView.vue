<template>
  <div class="login-page">
    <div class="tech-background"></div>

    <!-- Left Logo with cool animation behind it -->
    <div class="side-logo-container left-side">
      <div class="plasma-ring plasma-ring-left"></div>
      <div class="plasma-ring plasma-ring-left-2"></div>
      <img :src="UADECLogo" alt="UAdeC" class="huge-logo uadec-logo" />
    </div>

    <!-- Right Logo with cool animation behind it -->
    <div class="side-logo-container right-side">
      <div class="plasma-ring plasma-ring-right"></div>
      <div class="plasma-ring plasma-ring-right-2"></div>
      <img :src="ESLogo" alt="Escuela de Sistemas" class="huge-logo es-logo" />
    </div>

    <div class="login-wrapper">
      <div class="login-card g-page-animate">
        <div class="login-header">
          <h1 class="header-title">SGCF</h1>
          <p class="header-subtitle">Acceso al sistema de control financiero</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <GoogleInput v-model="username" label="Usuario" placeholder="Ej: admin" required autofocus />
          <GoogleInput v-model="password" label="Contraseña" type="password" placeholder="••••••••" required />

          <GoogleButton type="submit" class="login-submit-btn" :loading="loadingLocal">
            Iniciar sesión
          </GoogleButton>
        </form>

        <div class="sso-divider">
          <span>o continúa con</span>
        </div>

        <div class="sso-buttons">
          <div id="googleSignInDiv" class="sso-btn-google"></div>

          <GoogleButton type="button" variant="outlined" class="sso-btn ms-btn" :loading="loadingMicrosoft" @click="startMicrosoftLogin">
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
          <p>&copy; 2026 Sistema Gestor de Control Financiero</p>
        </div>
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
import { useToast } from '../composables/useToast';

import UADECLogo from '../assets/Logotipo-UADEC-vertical.webp';
import ESLogo from '../assets/ES-logoww.webp';

const toast = useToast();

const username = ref('');
const password = ref('');

const loadingLocal = ref(false);
const loadingMicrosoft = ref(false);
const loadingGoogle = ref(false);

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const googleClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();

let googleInitialized = false;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function parseAuthError(err: unknown, fallback: string): string {
  const response = (err as any)?.response;
  const data = response?.data;
  
  const backendMessage = String(data?.message ?? data?.error ?? '').trim();
  const raw = backendMessage || (err instanceof Error ? err.message : fallback);
  const normalized = raw.toLowerCase();
  
  if (response?.status === 429) {
    return data?.message || 'Demasiados intentos. Por favor, espera un momento antes de reintentar.';
  }

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

  await loadScriptOnce('google-gsi-client', 'https://accounts.google.com/gsi/client?hl=es');

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
      use_fedcm_for_prompt: false,
      itp_support: true,
      ux_mode: 'popup',
    });
    
    const googleBtnDiv = document.getElementById('googleSignInDiv');
    if (googleBtnDiv) {
      win.google.accounts.id.renderButton(googleBtnDiv, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      });

      const googleBtnInner = googleBtnDiv.querySelector('div');
      if (googleBtnInner) {
        googleBtnInner.style.width = '100%';
        googleBtnInner.style.maxWidth = '100%';
      }
    }

    googleInitialized = true;
  }
}

async function handleLogin() {
  if (!username.value || !password.value) return;

  loadingLocal.value = true;

  try {
    await auth.login(username.value, password.value);
    router.push('/dashboard-alumnos');
  } catch (err) {
    console.error(err);
    toast.error(parseAuthError(err, 'Usuario o contrasena incorrectos.'));
  } finally {
    loadingLocal.value = false;
  }
}

function handleGoogleCredential(response: { credential?: string }) {
  console.log('[Auth] CALLBACK DISPARADO! token:', response?.credential ? 'Sí' : 'No');
  const idToken = String(response?.credential ?? '');
  if (!idToken) {
    loadingGoogle.value = false;
    toast.error('Google no devolvio un token valido.');
    console.error('[Auth] Fallo: no se recibió token.');
    return;
  }

  let avatarUrl: string | null = null;
  try {
    const base64Url = idToken.split('.')[1] || '';
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const paddedBase64 = base64 + '='.repeat(padLen);
    const jsonPayload = decodeURIComponent(
      atob(paddedBase64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    avatarUrl = payload.picture || null;
    console.log('[Auth] Avatar extraído de Google:', avatarUrl ? 'Sí' : 'No');
  } catch (e) {
    console.warn('[Auth] No se pudo decodificar el JWT de Google para extraer el avatar:', e);
  }

  console.log('[Auth] Iniciando llamada al backend...');
  loadingGoogle.value = true;
  void (async () => {
    try {
      await auth.loginWithGoogle(idToken, avatarUrl);
      console.log('[Auth] Éxito. Redirigiendo a /inicio');
      router.push('/dashboard-alumnos');
    } catch (err) {
      console.error('[Auth] Error devuelto por el backend:', err);
      toast.error(parseAuthError(err, 'No fue posible iniciar sesion con Google.'));
    } finally {
      loadingGoogle.value = false;
    }
  })();
}
async function startMicrosoftLogin() {
  loadingMicrosoft.value = true;

  try {
    const result = await loginPopup();
    const idToken = result.idToken;

    if (!idToken) {
      throw new Error('No se recibió un idToken válido de Microsoft.');
    }

    // Intentar obtener la foto de perfil desde Microsoft Graph API
    let avatarUrl: string | null = null;
    if (result.accessToken) {
      try {
        const response = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
          headers: { Authorization: `Bearer ${result.accessToken}` },
        });
        if (response.ok) {
          const blob = await response.blob();
          avatarUrl = await blobToDataUrl(blob);
          console.log('[Auth] Foto de perfil obtenida de Microsoft Graph.');
        }
      } catch {
        console.warn('[Auth] No se pudo obtener la foto de perfil de Microsoft Graph.');
      }
    }

    await auth.loginWithMicrosoft({ id_token: idToken, foto_url: avatarUrl }, avatarUrl);
    router.push('/dashboard-alumnos');
  } catch (err: any) {
    if (err.name === 'BrowserAuthError' && err.errorCode === 'user_cancelled') {
        console.warn('[MSAL] Login cancelado por el usuario.');
        return;
    }
    console.error(err);
    toast.error(parseAuthError(err, 'No fue posible completar el inicio de sesión con Microsoft.'));
  } finally {
    loadingMicrosoft.value = false;
  }
}

onMounted(() => {
  if (route.query.reason === 'inactive') {
    toast.error('Tu sesion fue cerrada porque el usuario esta inactivo.');
  }

  console.log('[Auth] Google Client ID:', googleClientId);

  ensureGoogleIdentityReady()
    .then(() => console.log('[Auth] Google ready'))
    .catch((e) => {
      console.warn('[Auth] Google init error:', e);
      toast.error(parseAuthError(e, 'No fue posible cargar Google Sign-In.'));
    });

  initializeMsal()
    .then(() => console.log('[Auth] MSAL ready'))
    .catch((e) => console.warn('[Auth] MSAL init error:', e));
});
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--md-sys-color-background);
  position: relative;
  overflow-x: hidden;
  padding: 1.5rem;
}

.tech-background {
  position: absolute;
  inset: 0;
  background: var(--md-sys-color-background);
  z-index: 1;
}

/* Side Logos with Animations */
.side-logo-container {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 300px;
  height: 300px;
}

.left-side {
  left: 8%;
}

.right-side {
  right: 8%;
}

.huge-logo {
  object-fit: contain;
  position: relative;
  z-index: 3;
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  filter: drop-shadow(0 0 20px rgba(0,0,0,0.5));
}

.uadec-logo {
  max-width: 240px;
  max-height: 240px;
}

.es-logo {
  max-width: 170px;
  max-height: 170px;
}

/* Cool animated plasma rings surrounding the logos */
.plasma-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid;
  background: transparent;
  animation: plasmaPulse 4s ease-in-out infinite alternate;
  box-shadow: 0 0 40px rgba(0, 120, 212, 0.15), inset 0 0 40px rgba(0, 120, 212, 0.05);
}

.plasma-ring-left {
  width: 90%;
  height: 90%;
  border-color: rgba(0, 120, 212, 0.3);
  box-shadow: 0 0 50px rgba(0, 120, 212, 0.2), inset 0 0 50px rgba(0, 120, 212, 0.05);
}

.plasma-ring-left-2 {
  width: 70%;
  height: 70%;
  border-color: rgba(0, 180, 216, 0.2);
  border-width: 1px;
  animation: plasmaPulse 5s ease-in-out infinite alternate-reverse;
  box-shadow: 0 0 30px rgba(0, 180, 216, 0.1), inset 0 0 30px rgba(0, 180, 216, 0.03);
}

.plasma-ring-right {
  width: 90%;
  height: 90%;
  border-color: rgba(41, 182, 246, 0.3);
  box-shadow: 0 0 50px rgba(41, 182, 246, 0.2), inset 0 0 50px rgba(41, 182, 246, 0.05);
}

.plasma-ring-right-2 {
  width: 70%;
  height: 70%;
  border-color: rgba(25, 118, 210, 0.2);
  border-width: 1px;
  animation: plasmaPulse 6s ease-in-out infinite alternate-reverse;
  box-shadow: 0 0 30px rgba(25, 118, 210, 0.1), inset 0 0 30px rgba(25, 118, 210, 0.03);
}

@keyframes plasmaPulse {
  0% { opacity: 0.5; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.08); }
}

.login-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 10;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--md-sys-color-surface);
  border-radius: 8px;
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--md-sys-color-outline);
  animation: cardFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-header {
  margin-bottom: 1.75rem;
  text-align: center;
}

.header-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: var(--md-sys-color-on-surface);
  letter-spacing: -0.02em;
}

.header-subtitle {
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.9rem;
  margin: 0.35rem 0 0;
  font-weight: 400;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.login-submit-btn {
  width: 100%;
  margin-top: 0.35rem;
  height: 48px;
  font-size: 0.95rem;
  font-weight: 600;
}

.sso-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1.5rem 0 1.1rem;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.8rem;
  gap: 0.75rem;
}

.sso-divider::before,
.sso-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--md-sys-color-outline);
}

.sso-buttons {
  display: grid;
  gap: 0.75rem;
}

.sso-btn-google {
  width: 100%;
  display: flex;
  justify-content: center;
}

.sso-btn-google :deep(.abcRioButton),
.sso-btn-google :deep(div[role="button"]),
.sso-btn-google > div > div {
  width: 100% !important;
  border-radius: 8px !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
}

.sso-btn-google > div > div:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
}

.sso-btn {
  width: 100%;
  justify-content: center;
  height: 44px;
  font-size: 0.88rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.ms-btn {
  background: var(--md-sys-color-primary) !important;
  border: 1px solid var(--md-sys-color-primary) !important;
  color: var(--md-sys-color-on-primary) !important;
  font-weight: 500;
}

.ms-btn:hover {
  background: var(--md-sys-color-primary) !important;
  color: var(--md-sys-color-on-primary) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--md-sys-color-primary), transparent 80%);
  filter: brightness(0.92);
}

.sso-brand-img {
  width: 18px;
  height: 18px;
  margin-right: 8px;
}

.sso-hint {
  margin: 0.85rem 0 0;
  font-size: 0.78rem;
  color: var(--md-sys-color-on-info-container);
  background: var(--md-sys-color-info-container);
  border: 1px solid var(--md-sys-color-outline-variant);
  padding: 0.7rem 1rem;
  border-radius: 4px;
}

.register-entry {
  margin-top: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.84rem;
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
}

@media (max-width: 1200px) {
  .side-logo-container {
    width: 200px;
    height: 200px;
  }
  .huge-logo {
    max-width: 150px;
    max-height: 150px;
  }
  .left-side {
    left: 2%;
  }
  .right-side {
    right: 2%;
  }
}

@media (max-width: 900px) {
  .side-logo-container {
    display: none; /* Hide huge logos on small screens */
  }
}

@media (max-width: 480px) {
  .login-page {
    padding: 0.75rem;
  }
  .login-card {
    padding: 1.5rem 1.25rem;
  }
  .header-title {
    font-size: 1.7rem;
  }
}
</style>

