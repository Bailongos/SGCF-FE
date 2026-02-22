<template>
  <div class="register-container">
    <div class="register-card g-page-animate">
      <div class="register-header">
        <h1 class="header-title">Registro de usuario</h1>
        <p class="header-subtitle">
          Crea tu cuenta local. Quedara en estado pendiente hasta activacion por Administrador Global.
        </p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <GoogleInput
          v-model="form.username"
          label="Usuario *"
          placeholder="Ej: juan.perez"
          required
          autofocus
        />

        <GoogleInput
          v-model="form.password"
          label="Contrasena *"
          type="password"
          placeholder="Minimo 8 caracteres"
          required
        />

        <GoogleInput
          v-model="form.confirmPassword"
          label="Confirmar contrasena *"
          type="password"
          placeholder="Repite la contrasena"
          required
        />

        <div v-if="error" class="error-box">
          <span class="material-symbols-outlined">error</span>
          <span>{{ error }}</span>
        </div>

        <div v-if="success" class="success-box">
          <span class="material-symbols-outlined">check_circle</span>
          <span>{{ success }}</span>
        </div>

        <GoogleButton type="submit" class="register-submit-btn" :loading="loading" color="#1a73e8">
          Registrar usuario
        </GoogleButton>
      </form>

      <div class="register-footer-actions">
        <RouterLink to="/login" custom v-slot="{ navigate }">
          <GoogleButton type="button" variant="text" @click="navigate">
            Ya tengo cuenta, ir a login
          </GoogleButton>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import GoogleInput from '../components/ui/input.vue';
import GoogleButton from '../components/ui/button.vue';
import { register } from '../services/auth';

const loading = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const defaultPendingRoleId = 6;

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
});

function resetForm() {
  form.username = '';
  form.password = '';
  form.confirmPassword = '';
}

function validateForm(): boolean {
  error.value = null;

  const username = form.username.trim();
  const password = form.password;
  const confirmPassword = form.confirmPassword;

  if (!username) {
    error.value = 'El usuario es obligatorio.';
    return false;
  }

  if (password.length < 8) {
    error.value = 'La contrasena debe tener minimo 8 caracteres.';
    return false;
  }

  if (password !== confirmPassword) {
    error.value = 'Las contrasenas no coinciden.';
    return false;
  }

  return true;
}

function parseError(err: unknown): string {
  const responseData = (err as any)?.response?.data;
  const responseMessage = responseData?.message;
  if (responseMessage) return String(responseMessage);

  const firstValidationError = Array.isArray(responseData?.errors)
    ? responseData.errors[0]
    : null;

  if (firstValidationError) {
    if (typeof firstValidationError === 'string') return firstValidationError;
    if (typeof firstValidationError?.message === 'string') return firstValidationError.message;
  }

  if (typeof responseData?.error === 'string') return responseData.error;
  if (err instanceof Error) return err.message;
  return 'No fue posible registrar el usuario.';
}

async function handleRegister() {
  if (!validateForm()) return;

  loading.value = true;
  error.value = null;
  success.value = null;

  try {
    const response = await register({
      username: form.username.trim(),
      password: form.password,
      id_rol: defaultPendingRoleId,
      id_carrera: null,
      activo: false,
    });

    success.value =
      response?.message ||
      'Registro exitoso. Tu cuenta fue creada como pendiente e inactiva. Un administrador debe activarla.';

    resetForm();
  } catch (err) {
    console.error(err);
    error.value = parseError(err);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top left, #e8f0fe 0%, transparent 35%),
    radial-gradient(circle at bottom right, #e6f4ea 0%, transparent 40%),
    #f8f9fa;
  padding: 1.5rem;
}

.register-card {
  width: 100%;
  max-width: 460px;
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 22px;
  padding: 2rem;
  box-shadow: 0 14px 35px rgba(32, 33, 36, 0.12);
}

.register-header {
  margin-bottom: 1.3rem;
}

.header-title {
  margin: 0;
  font-size: 1.55rem;
  color: #1a73e8;
}

.header-subtitle {
  margin: 0.45rem 0 0;
  font-size: 0.9rem;
  color: #5f6368;
  line-height: 1.45;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.register-submit-btn {
  width: 100%;
  margin-top: 0.35rem;
}

.error-box,
.success-box {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 8px;
  padding: 0.65rem 0.75rem;
  font-size: 0.85rem;
}

.error-box {
  color: #b3261e;
  background: #fdeceb;
  border: 1px solid #f6c8c4;
}

.success-box {
  color: #137333;
  background: #e6f4ea;
  border: 1px solid #b7dfc7;
}

.register-footer-actions {
  margin-top: 1.1rem;
  display: flex;
  justify-content: center;
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
