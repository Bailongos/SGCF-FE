<template>
  <section class="page g-page-animate">
    <div class="back-to-home">
      <RouterLink to="/inicio" custom v-slot="{ navigate }">
        <GoogleButton @click="navigate" color="#1a73e8" size="sm">
          <span class="material-symbols-outlined">arrow_back</span>
          Volver a inicio
        </GoogleButton>
      </RouterLink>
    </div>

    <header class="page-header">
      <div>
        <h2 class="page-title">Administracion de usuarios y permisos</h2>
        <p class="page-subtitle">
          Gestion centralizada de roles, alcance por carrera y metodos de acceso.
        </p>
      </div>

      <div class="page-header-meta">
        <span class="chip chip-soft">Total: <strong>{{ usuarios.length }}</strong></span>
        <span class="chip chip-success">Activos: <strong>{{ activosCount }}</strong></span>
        <span class="chip chip-warning">Pendientes: <strong>{{ pendientesCount }}</strong></span>

        <GoogleButton size="sm" color="#1a73e8" @click="openCreateForm">
          <span class="material-symbols-outlined">person_add</span>
          Crear usuario
        </GoogleButton>
      </div>
    </header>

    <SectionCard icon="tune" title="Filtros" subtitle="Refina la busqueda por rol, carrera y estado." density="comfortable">
      <AdminUsersFilters
        :search="filters.search"
        :role="filters.role"
        :career="filters.career"
        :status="filters.status"
        :roles="roleFilterOptions"
        :careers="careerFilterOptions"
        @update:search="filters.search = $event"
        @update:role="filters.role = $event"
        @update:career="filters.career = $event"
        @update:status="filters.status = $event"
      />
    </SectionCard>

    <SectionCard
      icon="manage_accounts"
      title="Usuarios"
      subtitle="Edita rol, alcance y activacion de cuentas."
      density="comfortable"
    >
      <template #header-extra>
        <GoogleButton size="sm" variant="text" :loading="loadingList" @click="loadData">
          Recargar
        </GoogleButton>
      </template>

      <p v-if="successMessage" class="success-box">{{ successMessage }}</p>

      <AdminUsersTable
        :rows="filteredRows"
        :loading="loadingList"
        :error="error"
        :showCreatedAt="showCreatedAt"
        @edit="onEditRow"
        @toggle-active="onToggleActive"
      />
    </SectionCard>

    <GoogleModal
      v-model="showFormModal"
      :icon="isEditing ? 'manage_accounts' : 'person_add'"
      :title="isEditing ? 'Editar usuario' : 'Crear usuario'"
      :subtitle="isEditing ? 'Actualiza rol, alcance y estado.' : 'Alta de usuario local o preregistro por email.'"
      maxWidth="780px"
      density="comfortable"
      :confirmLoading="loadingSave"
      :confirmText="isEditing ? 'Guardar cambios' : 'Crear usuario'"
      cancelText="Cancelar"
      @confirm="submitForm"
      @cancel="closeForm"
    >
      <form class="user-form" @submit.prevent="submitForm">
        <div class="user-form-grid">
          <GoogleSelect
            v-if="!isEditing"
            v-model="form.createMode"
            :options="createModeOptions"
            label="Modo de alta *"
            placeholder="Selecciona modo"
          />

          <GoogleInput
            v-model="form.username"
            label="Usuario *"
            placeholder="Ej. maria.lopez"
            :required="true"
          />

          <GoogleInput
            v-model="form.email"
            label="Email"
            type="email"
            placeholder="usuario@dominio.com"
            :required="!isEditing && form.createMode === 'preregister'"
          />

          <GoogleInput
            v-model="form.password"
            label="Password"
            type="password"
            :required="!isEditing && form.createMode === 'local'"
            :hint="isEditing ? 'Opcional: escribe solo si deseas resetear password local.' : 'Temporal para primer acceso.'"
            placeholder="••••••••"
          />

          <GoogleSelect
            v-model="form.id_rol"
            :options="roleOptions"
            label="Rol *"
            placeholder="Selecciona rol"
            required
          />

          <GoogleSelect
            v-model="form.id_carrera"
            :options="careerOptions"
            label="Carrera / alcance"
            placeholder="Global"
            :disabled="isAdminRole"
            :required="isCoordinatorRole"
            :hint="careerHint"
          />

          <label class="checkbox-field">
            <input v-model="form.activo" type="checkbox" :disabled="isPendingFromCreateMode" />
            <span>Usuario activo</span>
          </label>
        </div>

        <p v-if="formError" class="form-error">{{ formError }}</p>
      </form>
    </GoogleModal>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import SectionCard from '../components/layout/sideCard.vue';
import GoogleButton from '../components/ui/button.vue';
import GoogleInput from '../components/ui/input.vue';
import GoogleSelect from '../components/ui/select.vue';
import GoogleModal from '../components/modal/modal.vue';
import AdminUsersFilters from '../components/admin/AdminUsersFilters.vue';
import AdminUsersTable, { type AdminUserTableRow } from '../components/admin/AdminUsersTable.vue';

import {
  createAdminUsuario,
  getAdminCarreras,
  getAdminRoles,
  getAdminUsuarios,
  patchAdminUsuario,
  type AdminCarrera,
  type AdminRol,
  type AdminUsuario,
  type AdminUsuarioPayload,
} from '../services/admin-usuarios';

type CreateMode = 'local' | 'preregister';

interface UserFormState {
  id_usuario: number | null;
  createMode: CreateMode;
  username: string;
  email: string;
  password: string;
  id_rol: number | null;
  id_carrera: number | null;
  activo: boolean;
}

const usuarios = ref<AdminUsuario[]>([]);
const roles = ref<AdminRol[]>([]);
const carreras = ref<AdminCarrera[]>([]);

const loadingList = ref(false);
const loadingSave = ref(false);
const error = ref<string | null>(null);
const formError = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const showFormModal = ref(false);
const isEditing = ref(false);

const filters = reactive({
  search: '',
  role: '' as string | number | null,
  career: '' as string | number | null,
  status: '' as string | number | null,
});

function getEmptyForm(): UserFormState {
  return {
    id_usuario: null,
    createMode: 'local',
    username: '',
    email: '',
    password: '',
    id_rol: null,
    id_carrera: null,
    activo: true,
  };
}

const form = ref<UserFormState>(getEmptyForm());

const createModeOptions = [
  { value: 'local', label: 'Usuario local' },
  { value: 'preregister', label: 'Preregistro por email' },
];

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function getRoleLabel(user: AdminUsuario): string {
  if (user.rol_nombre) return String(user.rol_nombre);
  const role = roles.value.find((item) => Number(item.id_rol) === Number(user.id_rol));
  return role?.nombre_rol ?? `Rol ${user.id_rol}`;
}

function getCareerLabel(user: AdminUsuario): string {
  if (user.id_carrera === null || user.id_carrera === undefined || user.id_carrera === '') {
    return 'Global';
  }

  const carrera = carreras.value.find((item) => Number(item.id_carrera) === Number(user.id_carrera));
  return carrera?.nombre ?? `Carrera ${user.id_carrera}`;
}

function getUserStatus(user: AdminUsuario): 'activo' | 'inactivo' | 'pendiente' {
  const status = normalizeText(user.estado ?? (user as any).status);
  if (status.includes('pend')) return 'pendiente';
  if (status.includes('inact') || status.includes('baja')) return 'inactivo';
  if (status.includes('act')) return 'activo';

  const activeRaw = (user as any).activo;
  if (activeRaw === false || activeRaw === 0 || activeRaw === '0' || activeRaw === 'false') {
    return 'inactivo';
  }

  return 'activo';
}

function statusLabel(status: 'activo' | 'inactivo' | 'pendiente'): string {
  if (status === 'pendiente') return 'Pendiente';
  if (status === 'inactivo') return 'Inactivo';
  return 'Activo';
}

function hasProvider(user: AdminUsuario, provider: 'local' | 'google' | 'microsoft'): boolean {
  const providersList = (user as any).metodos_acceso ?? (user as any).providers ?? (user as any).identidades;
  const providerSet = Array.isArray(providersList)
    ? providersList.map((item) => normalizeText(item))
    : String(providersList ?? '')
        .split(',')
        .map((item) => normalizeText(item))
        .filter(Boolean);

  const keyGroups: Record<'local' | 'google' | 'microsoft', string[]> = {
    local: ['local_enabled', 'has_local', 'local_linked', 'password_set'],
    google: ['google_linked', 'has_google', 'google_enabled'],
    microsoft: ['microsoft_linked', 'has_microsoft', 'microsoft_enabled'],
  };

  const hasByFlag = keyGroups[provider].some((key) => {
    const value = (user as any)[key];
    return value === true || value === 1 || value === '1' || value === 'true';
  });

  if (hasByFlag) return true;
  if (providerSet.includes(provider)) return true;

  if (provider === 'google') {
    return Boolean((user as any).google_sub || (user as any).google_id);
  }

  if (provider === 'microsoft') {
    return Boolean((user as any).microsoft_oid || (user as any).azure_oid);
  }

  const hasExternal = providerSet.includes('google') || providerSet.includes('microsoft');
  return !hasExternal;
}

function getCreatedAtLabel(user: AdminUsuario): string {
  const raw = user.fecha_creacion ?? user.created_at ?? (user as any).fechaAlta;
  if (!raw) return '';
  const iso = String(raw);
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

const tableRows = computed<AdminUserTableRow[]>(() => {
  return usuarios.value.map((user) => {
    const status = getUserStatus(user);
    return {
      id_usuario: Number(user.id_usuario),
      username: String(user.username ?? ''),
      email: String(user.email ?? ''),
      rolLabel: getRoleLabel(user),
      carreraLabel: getCareerLabel(user),
      status,
      statusLabel: statusLabel(status),
      isActive: status === 'activo',
      hasLocal: hasProvider(user, 'local'),
      hasGoogle: hasProvider(user, 'google'),
      hasMicrosoft: hasProvider(user, 'microsoft'),
      createdAtLabel: getCreatedAtLabel(user),
    };
  });
});

const showCreatedAt = computed(() => tableRows.value.some((row) => !!row.createdAtLabel));

const filteredRows = computed(() => {
  const search = normalizeText(filters.search);

  return tableRows.value.filter((row) => {
    const matchSearch =
      !search ||
      normalizeText(row.username).includes(search) ||
      normalizeText(row.email).includes(search);

    const matchRole =
      !filters.role ||
      Number(usuarios.value.find((user) => Number(user.id_usuario) === row.id_usuario)?.id_rol) === Number(filters.role);

    const user = usuarios.value.find((item) => Number(item.id_usuario) === row.id_usuario);
    const isGlobal = user?.id_carrera === null || user?.id_carrera === undefined || user?.id_carrera === '';
    const matchCareer =
      !filters.career ||
      (filters.career === 'global' && isGlobal) ||
      Number(user?.id_carrera) === Number(filters.career);

    const matchStatus = !filters.status || row.status === filters.status;

    return matchSearch && matchRole && matchCareer && matchStatus;
  });
});

const activosCount = computed(() => tableRows.value.filter((row) => row.status === 'activo').length);
const pendientesCount = computed(() => tableRows.value.filter((row) => row.status === 'pendiente').length);

const roleOptions = computed(() =>
  roles.value.map((role) => ({
    value: role.id_rol,
    label: role.nombre_rol,
  })),
);

const roleFilterOptions = computed(() => roleOptions.value);

const careerOptions = computed(() => [
  { value: null, label: 'Global' },
  ...carreras.value.map((career) => ({
    value: career.id_carrera,
    label: career.nombre,
  })),
]);

const careerFilterOptions = computed(() =>
  carreras.value.map((career) => ({
    value: career.id_carrera,
    label: career.nombre,
  })),
);

const selectedRoleName = computed(() => {
  const found = roles.value.find((item) => Number(item.id_rol) === Number(form.value.id_rol));
  return normalizeText(found?.nombre_rol ?? '');
});

const isAdminRole = computed(() => selectedRoleName.value.includes('admin'));
const isCoordinatorRole = computed(() => selectedRoleName.value.includes('coordin'));

const isPendingFromCreateMode = computed(() => !isEditing.value && form.value.createMode === 'preregister');

const careerHint = computed(() => {
  if (isAdminRole.value) return 'Administrador siempre opera en alcance global.';
  if (isCoordinatorRole.value) return 'Coordinador requiere carrera asignada.';
  return 'Caja y otros perfiles pueden ser globales o por carrera.';
});

watch(
  () => form.value.id_rol,
  () => {
    if (isAdminRole.value) {
      form.value.id_carrera = null;
    }
  },
);

watch(
  () => form.value.createMode,
  () => {
    if (!isEditing.value) {
      form.value.activo = form.value.createMode === 'local';
    }
  },
);

function setSuccessMessage(message: string) {
  successMessage.value = message;
  window.setTimeout(() => {
    if (successMessage.value === message) {
      successMessage.value = null;
    }
  }, 2400);
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as any)?.response?.data;
  const backendMessage = data?.message ?? data?.error;
  if (backendMessage) return String(backendMessage);
  if (err instanceof Error) return err.message;
  return fallback;
}

async function loadData() {
  try {
    loadingList.value = true;
    error.value = null;

    const [usersResult, rolesResult, careersResult] = await Promise.all([
      getAdminUsuarios(),
      getAdminRoles(),
      getAdminCarreras(),
    ]);

    usuarios.value = usersResult;
    roles.value = rolesResult;
    carreras.value = careersResult;
  } catch (err) {
    console.error(err);
    error.value = getApiErrorMessage(err, 'No se pudieron cargar los usuarios.');
  } finally {
    loadingList.value = false;
  }
}

function resetForm() {
  form.value = getEmptyForm();
  formError.value = null;
}

function openCreateForm() {
  isEditing.value = false;
  resetForm();
  showFormModal.value = true;
}

function closeForm() {
  showFormModal.value = false;
  resetForm();
}

function onEditRow(row: AdminUserTableRow) {
  const source = usuarios.value.find((item) => Number(item.id_usuario) === row.id_usuario);
  if (!source) return;

  isEditing.value = true;
  formError.value = null;
  form.value = {
    id_usuario: Number(source.id_usuario),
    createMode: 'local',
    username: String(source.username ?? ''),
    email: String(source.email ?? ''),
    password: '',
    id_rol: Number(source.id_rol),
    id_carrera:
      source.id_carrera === null || source.id_carrera === undefined || source.id_carrera === ''
        ? null
        : Number(source.id_carrera),
    activo: getUserStatus(source) === 'activo',
  };

  showFormModal.value = true;
}

async function onToggleActive(row: AdminUserTableRow) {
  const nextState = !row.isActive;
  try {
    loadingSave.value = true;
    formError.value = null;
    await patchAdminUsuario(row.id_usuario, { activo: nextState });

    const index = usuarios.value.findIndex((item) => Number(item.id_usuario) === row.id_usuario);
    if (index >= 0) {
      const current = usuarios.value[index];
      if (current) {
        usuarios.value[index] = {
          ...current,
          activo: nextState,
        };
      }
    }

    setSuccessMessage(nextState ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.');
  } catch (err) {
    console.error(err);
    error.value = getApiErrorMessage(err, 'No se pudo actualizar el estado del usuario.');
  } finally {
    loadingSave.value = false;
  }
}

function validateForm(): boolean {
  formError.value = null;

  if (!form.value.username.trim()) {
    formError.value = 'El username es obligatorio.';
    return false;
  }

  if (!form.value.id_rol) {
    formError.value = 'Selecciona un rol para el usuario.';
    return false;
  }

  if (isCoordinatorRole.value && (form.value.id_carrera === null || form.value.id_carrera === undefined)) {
    formError.value = 'Coordinador requiere una carrera asignada.';
    return false;
  }

  if (!isEditing.value && form.value.createMode === 'local' && !form.value.password.trim()) {
    formError.value = 'Debes definir password temporal para usuario local.';
    return false;
  }

  if (!isEditing.value && form.value.createMode === 'preregister' && !form.value.email.trim()) {
    formError.value = 'Email es obligatorio para preregistro.';
    return false;
  }

  return true;
}

function buildPayload(): AdminUsuarioPayload {
  const payload: AdminUsuarioPayload = {
    username: form.value.username.trim(),
    email: form.value.email.trim() || null,
    id_rol: Number(form.value.id_rol),
    id_carrera: isAdminRole.value
      ? null
      : form.value.id_carrera === null || form.value.id_carrera === undefined
        ? null
        : Number(form.value.id_carrera),
    activo: isPendingFromCreateMode.value ? false : Boolean(form.value.activo),
  };

  const password = form.value.password.trim();
  if (password) {
    payload.password = password;
  }

  return payload;
}

async function submitForm() {
  if (!validateForm()) return;

  try {
    loadingSave.value = true;
    error.value = null;

    const payload = buildPayload();

    if (isEditing.value && form.value.id_usuario) {
      const updated = await patchAdminUsuario(form.value.id_usuario, payload);
      const index = usuarios.value.findIndex((item) => Number(item.id_usuario) === Number(updated.id_usuario));
      if (index >= 0) {
        usuarios.value[index] = updated;
      } else {
        usuarios.value.unshift(updated);
      }
      setSuccessMessage('Usuario actualizado correctamente.');
    } else {
      const created = await createAdminUsuario(payload);
      usuarios.value.unshift(created);
      setSuccessMessage('Usuario creado correctamente.');
    }

    closeForm();
  } catch (err) {
    console.error(err);
    formError.value = getApiErrorMessage(err, 'No se pudo guardar el usuario.');
  } finally {
    loadingSave.value = false;
  }
}

onMounted(loadData);
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.g-page-animate {
  animation: g-fade-in 180ms ease-out;
}

@keyframes g-fade-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.back-to-home {
  margin-bottom: 0.35rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
}

.page-title {
  margin: 0;
  font-size: 1.6rem;
  color: #202124;
}

.page-subtitle {
  margin: 0.3rem 0 0;
  color: #5f6368;
  font-size: 0.9rem;
}

.page-header-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.76rem;
}

.chip-soft {
  background: #f1f3f4;
  color: #5f6368;
}

.chip-success {
  background: #e6f4ea;
  color: #137333;
}

.chip-warning {
  background: #fff3cd;
  color: #8a6100;
}

.success-box {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: #e6f4ea;
  border: 1px solid #b7dfc7;
  color: #137333;
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem 1rem;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  color: #3c4043;
  margin-top: 1.35rem;
}

.form-error {
  margin: 0;
  border: 1px solid #f6c8c4;
  background: #fdeceb;
  color: #b3261e;
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  font-size: 0.84rem;
}

@media (max-width: 900px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .user-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
