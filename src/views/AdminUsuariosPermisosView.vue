<!-- src/views/AdminUsuariosPermisosView.vue -->
<template>
  <section class="page g-page-animate">
    <div class="back-to-home">
      <RouterLink to="/inicio" custom v-slot="{ navigate }">
        <GoogleButton @click="navigate" variant="text" size="sm">
          <span class="material-symbols-outlined">arrow_back</span>
          Volver a inicio
        </GoogleButton>
      </RouterLink>
    </div>

    <header class="page-header">
      <div class="header-content">
        <h2 class="page-title">Usuarios y Permisos</h2>
        <p class="page-subtitle">
          Gestión centralizada de roles, alcance por carrera y métodos de acceso.
        </p>
      </div>

      <div class="page-header-meta">
        <div class="status-summary">
          <GoogleChip variant="soft">Total: <strong>{{ usuarios.length }}</strong></GoogleChip>
          <GoogleChip variant="success">Activos: <strong>{{ activosCount }}</strong></GoogleChip>
          <GoogleChip variant="warning">Pendientes: <strong>{{ pendientesCount }}</strong></GoogleChip>
        </div>

        <GoogleButton variant="filled" size="sm" @click="openCreateForm">
          <span class="material-symbols-outlined">person_add</span>
          Crear usuario
        </GoogleButton>
      </div>
    </header>

    <main class="admin-main">
      <FilterBar :activeCount="filterActiveCount" @clear="clearFilters">
        <GoogleInput v-model="filters.search" label="Buscar" placeholder="Usuario o email" size="sm" />

        <GoogleSelect v-model="filters.role" :options="roleSelectOptions" label="Rol" placeholder="Todos" size="sm" />

        <GoogleSelect v-model="filters.career" :options="careerSelectOptions" label="Carrera" placeholder="Todas" size="sm" />

        <GoogleSelect v-model="filters.status" :options="statusOptions" label="Estado" placeholder="Todos" size="sm" />

        <template #actions>
          <GoogleButton variant="text" size="sm" :loading="loadingList" @click="loadData">
            <span class="material-symbols-outlined">refresh</span>
            Recargar
          </GoogleButton>
        </template>
      </FilterBar>

      <SectionCard
        icon="manage_accounts"
        title="Usuarios Registrados"
        subtitle="Edita rol, alcance y activación de cuentas."
        density="comfortable"
      >
        <AdminUsersTable
          :rows="filteredRows"
          :loading="loadingList"
          :showCreatedAt="showCreatedAt"
          @edit="onEditRow"
          @toggle-active="onToggleActive"
        />
      </SectionCard>
    </main>

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
      <AdminUserForm 
        :form="form"
        :isEditing="isEditing"
        :roleOptions="roleOptions"
        :careerOptions="careerOptions"
        :isAdminRole="isAdminRole"
        :isCoordinatorRole="isCoordinatorRole"
        :isPendingFromCreateMode="isPendingFromCreateMode"
        :careerHint="careerHint"
        @submit="submitForm"
      />
    </GoogleModal>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';

import SectionCard from '../components/layout/sideCard.vue';
import FilterBar from '../components/ui/FilterBar.vue';
import GoogleButton from '../components/ui/button.vue';
import GoogleInput from '../components/ui/input.vue';
import GoogleSelect from '../components/ui/select.vue';
import GoogleModal from '../components/modal/modal.vue';
import GoogleChip from '../components/ui/chip.vue';
import AdminUserForm from '../components/admin/AdminUserForm.vue';
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
import { formatCarreraLabel } from '../utils/carreras';

const authStore = useAuthStore();
const toast = useToast();

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
    id_carrera: authStore.isAdmin
      ? null
      : authStore.userCareerId !== null && authStore.userCareerId !== undefined
      ? Number(authStore.userCareerId)
      : null,
    activo: true,
  };
}

const form = ref<UserFormState>(getEmptyForm());

function normalizeText(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function getRoleLabel(user: AdminUsuario): string {
  if (user.rol_nombre) return String(user.rol_nombre);
  const role = roles.value.find((item) => Number(item.id_rol) === Number(user.id_rol));
  return role?.nombre_rol ?? `Rol ${user.id_rol}`;
}

function getCareerLabel(user: AdminUsuario): string {
  if (user.id_carrera === null || user.id_carrera === undefined || user.id_carrera === '') return 'Global';
  const carrera = carreras.value.find((item) => Number(item.id_carrera) === Number(user.id_carrera));
  return carrera ? formatCarreraLabel(carrera) : `Carrera ${user.id_carrera}`;
}

function getUserStatus(user: AdminUsuario): 'activo' | 'inactivo' | 'pendiente' {
  const status = normalizeText(user.estado ?? (user as any).status);
  if (status.includes('pend')) return 'pendiente';
  if (status.includes('inact') || status.includes('baja')) return 'inactivo';
  if (status.includes('act')) return 'activo';
  return (user as any).activo === false || (user as any).activo === 0 ? 'inactivo' : 'activo';
}

function statusLabel(status: 'activo' | 'inactivo' | 'pendiente'): string {
  if (status === 'pendiente') return 'Pendiente';
  if (status === 'inactivo') return 'Inactivo';
  return 'Activo';
}

function hasProvider(user: AdminUsuario, provider: 'local' | 'google' | 'microsoft'): boolean {
  const providersList = (user as any).metodos_acceso ?? (user as any).providers ?? (user as any).identidades;
  const providerSet = Array.isArray(providersList) ? providersList.map((item) => normalizeText(item)) : String(providersList ?? '').split(',').map((item) => normalizeText(item)).filter(Boolean);
  const keyGroups: Record<'local' | 'google' | 'microsoft', string[]> = {
    local: ['local_enabled', 'has_local', 'local_linked', 'password_set'],
    google: ['google_linked', 'has_google', 'google_enabled'],
    microsoft: ['microsoft_linked', 'has_microsoft', 'microsoft_enabled'],
  };
  const keys = keyGroups[provider];
  const hasByFlag = keys.some((key) => (user as any)[key] === true || (user as any)[key] === 1);
  if (hasByFlag || providerSet.includes(provider)) return true;
  if (provider === 'google') return Boolean((user as any).google_sub || (user as any).google_id);
  if (provider === 'microsoft') return Boolean((user as any).microsoft_oid || (user as any).azure_oid);
  return !providerSet.includes('google') && !providerSet.includes('microsoft');
}

function getCreatedAtLabel(user: AdminUsuario): string {
  const raw = user.fecha_creacion ?? user.created_at ?? (user as any).fechaAlta;
  return raw ? String(raw).slice(0, 10) : '';
}

const tableRows = computed<AdminUserTableRow[]>(() => {
  return usuarios.value.map((user) => {
    const status = getUserStatus(user);
    const isUserAdmin = normalizeText(user.rol_nombre || getRoleLabel(user)).includes('admin');
    const canEdit = authStore.isAdmin || !isUserAdmin;
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
      canEdit,
    };
  });
});

const showCreatedAt = computed(() => tableRows.value.some((row) => !!row.createdAtLabel));
const filteredRows = computed(() => {
  const s = normalizeText(filters.search);
  return tableRows.value.filter((row) => {
    const matchSearch = !s || normalizeText(row.username).includes(s) || normalizeText(row.email).includes(s) || normalizeText(row.carreraLabel).includes(s);
    const user = usuarios.value.find((item) => Number(item.id_usuario) === row.id_usuario);
    const matchRole = !filters.role || Number(user?.id_rol) === Number(filters.role);
    const matchCareer = !filters.career || (filters.career === 'global' && !user?.id_carrera) || Number(user?.id_carrera) === Number(filters.career);
    const matchStatus = !filters.status || row.status === filters.status;
    return matchSearch && matchRole && matchCareer && matchStatus;
  });
});

const activosCount = computed(() => tableRows.value.filter((row) => row.status === 'activo').length);
const pendientesCount = computed(() => tableRows.value.filter((row) => row.status === 'pendiente').length);

const roleOptions = computed(() => {
  let filtered = roles.value;
  if (!authStore.isAdmin) {
    filtered = filtered.filter((role) => !normalizeText(role.nombre_rol).includes('admin'));
  }
  return filtered.map((role) => ({ value: role.id_rol, label: role.nombre_rol }));
});
const roleFilterOptions = computed(() => roles.value.map((role) => ({ value: role.id_rol, label: role.nombre_rol })));
const roleSelectOptions = computed(() => [
  { value: '', label: 'Todos los roles' },
  ...roleFilterOptions.value,
]);
const careerOptions = computed(() => {
  if (!authStore.isAdmin) {
    return carreras.value.map((career) => ({
      value: career.id_carrera,
      label: formatCarreraLabel(career),
    }));
  }
  return [
    { value: null, label: 'Global' },
    ...carreras.value.map((career) => ({
      value: career.id_carrera,
      label: formatCarreraLabel(career),
    })),
  ];
});
const careerSelectOptions = computed(() => [
  { value: '', label: 'Todas las carreras' },
  ...careerOptions.value,
]);
const careerFilterOptions = computed(() => carreras.value.map((career) => ({ value: career.id_carrera, label: formatCarreraLabel(career) })));
const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'pendiente', label: 'Pendiente' },
];

const filterActiveCount = computed(() =>
  [filters.search, filters.role, filters.career, filters.status]
    .filter(v => v !== '' && v !== null && v !== undefined).length
);

function clearFilters() {
  filters.search = '';
  filters.role = '';
  filters.career = '';
  filters.status = '';
}

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

watch(() => form.value.id_rol, () => { if (isAdminRole.value) form.value.id_carrera = null; });
watch(() => form.value.createMode, () => { if (!isEditing.value) form.value.activo = form.value.createMode === 'local'; });

function getApiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as any)?.response?.data;
  return data?.message || data?.error || (err instanceof Error ? err.message : fallback);
}

async function loadData() {
  try {
    loadingList.value = true;

    const [u, r, c] = await Promise.all([getAdminUsuarios(), getAdminRoles(), getAdminCarreras()]);
    usuarios.value = u; roles.value = r; carreras.value = c;
  } catch (err) { toast.error(getApiErrorMessage(err, 'Error al cargar datos.')); }
  finally { loadingList.value = false; }
}

function resetForm() { form.value = getEmptyForm(); }
function openCreateForm() { isEditing.value = false; resetForm(); showFormModal.value = true; }
function closeForm() { showFormModal.value = false; resetForm(); }

function onEditRow(row: AdminUserTableRow) {
  const source = usuarios.value.find((item) => Number(item.id_usuario) === row.id_usuario);
  if (!source) return;
  isEditing.value = true;
  form.value = {
    id_usuario: Number(source.id_usuario),
    createMode: 'local',
    username: String(source.username ?? ''),
    email: String(source.email ?? ''),
    password: '',
    id_rol: Number(source.id_rol),
    id_carrera: source.id_carrera !== null && source.id_carrera !== undefined && source.id_carrera !== ''
      ? Number(source.id_carrera)
      : (authStore.isAdmin ? null : (authStore.userCareerId !== null && authStore.userCareerId !== undefined ? Number(authStore.userCareerId) : null)),
    activo: getUserStatus(source) === 'activo',
  };
  showFormModal.value = true;
}

async function onToggleActive(row: AdminUserTableRow) {
  const nextState = !row.isActive;
  try {
    loadingSave.value = true;
    const source = usuarios.value.find((item) => Number(item.id_usuario) === row.id_usuario);
    await patchAdminUsuario(row.id_usuario, {
      username: source?.username,
      id_rol: source?.id_rol ? Number(source.id_rol) : undefined,
      id_carrera: source?.id_carrera ? Number(source.id_carrera) : null,
      email: source?.email || null,
      activo: nextState,
    });
    await loadData();
    toast.success(nextState ? 'Usuario activado.' : 'Usuario desactivado.');
  } catch (err) { toast.error(getApiErrorMessage(err, 'Error al actualizar.')); }
  finally { loadingSave.value = false; }
}

async function submitForm() {
  if (!form.value.username.trim() || !form.value.id_rol) { toast.error('Campos obligatorios faltantes.'); return; }
  try {
    loadingSave.value = true;
    const payload = {
      username: form.value.username.trim(),
      email: form.value.email.trim() || null,
      id_rol: Number(form.value.id_rol),
      id_carrera: isAdminRole.value ? null : form.value.id_carrera,
      activo: isPendingFromCreateMode.value ? false : Boolean(form.value.activo),
      password: form.value.password.trim() || undefined,
    } as AdminUsuarioPayload;

    if (isEditing.value && form.value.id_usuario) await patchAdminUsuario(form.value.id_usuario, payload);
    else await createAdminUsuario(payload);
    await loadData();
    closeForm();
    toast.success(isEditing.value ? 'Usuario actualizado.' : 'Usuario creado.');
  } catch (err) { toast.error(getApiErrorMessage(err, 'Error al guardar.')); }
  finally { loadingSave.value = false; }
}

onMounted(loadData);
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
}

.back-to-home { margin-bottom: 0.5rem; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.page-title {
  margin: 0 0 0.25rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
  letter-spacing: -0.01em;
}

.page-subtitle {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 1rem;
}

.page-header-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.status-summary {
  display: flex;
  gap: 0.5rem;
}

.admin-main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .page-header { flex-direction: column; align-items: flex-start; }
}
</style>
