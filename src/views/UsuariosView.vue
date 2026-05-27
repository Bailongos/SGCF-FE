<!-- src/views/UsuariosView.vue -->
<template>
  <section class="page g-page-animate">
    <!-- Botón para volver a Inicio -->
    <div class="back-to-home">
      <RouterLink to="/inicio" custom v-slot="{ navigate }">
        <GoogleButton @click="navigate" size="sm">
          <span class="material-symbols-outlined">arrow_back</span>
          Volver a inicio
        </GoogleButton>
      </RouterLink>
    </div>

    <!-- Header estilo Google -->
    <header class="page-header">
      <div>
        <h2 class="page-title">Usuarios del sistema</h2>
        <p class="page-subtitle">
          Administración de cuentas de acceso, roles y alcance de carrera.
        </p>
      </div>

      <div class="page-header-meta">
        <GoogleChip variant="soft">Total: <strong>{{ usuarios.length }}</strong></GoogleChip>
        <GoogleChip variant="soft">Activos: <strong>{{ usuariosActivos }}</strong></GoogleChip>

        <GoogleButton size="sm" @click="openCreateForm">
          <span class="material-symbols-outlined">person_add</span>
          Nuevo usuario
        </GoogleButton>
      </div>
    </header>

    <!-- Tabla genérica googlesca -->
    <GoogleTable :rows="usuariosRows" :columns="usuariosColumns" rowKey="id_usuario" :loading="loadingList"
      v-model:search="search" title="Listado de usuarios"
      subtitle="Consulta, edita o elimina usuarios registrados en el sistema." icon="manage_accounts" :showReload="true"
      :useDefaultActions="true" :searchKeys="['username', 'rolNombre', 'carreraNombre']"
      emptyMessage="No hay usuarios que coincidan con el filtro."
      @reload="loadUsuarios" @edit="onEdit" @delete="onDelete" />

    <!-- Modal Crear / Editar usuario -->
    <GoogleModal v-model="showFormModal" :icon="isEditing ? 'manage_accounts' : 'person_add'"
      :title="isEditing ? 'Editar usuario' : 'Nuevo usuario'"
      subtitle="Crea o edita usuarios y asigna su alcance (carrera o global)." maxWidth="780px" density="comfortable"
      :confirmLoading="loadingSave" :confirmText="isEditing ? 'Actualizar usuario' : 'Guardar usuario'"
      cancelText="Cancelar" @confirm="handleFormSubmit" @cancel="handleCancelForm">
      <form @submit.prevent="handleFormSubmit" class="user-form">
        <div class="user-form-grid">
          <!-- Username -->
          <GoogleInput v-model="form.username" label="Usuario *" placeholder="Ej. admin, juan.perez" required />

          <!-- Password -->
          <GoogleInput v-model="form.password" label="Contraseña" type="password"
            :hint="isEditing ? 'Déjala en blanco si no quieres cambiarla' : ''" :required="!isEditing"
            placeholder="••••••••" />

          <!-- Rol -->
          <GoogleSelect v-model="form.id_rol" :options="rolOptions" label="Rol *" placeholder="Selecciona un rol"
            required @update:modelValue="handleRolChange" />

          <!-- Carrera de alcance -->
          <div class="field">
            <span class="field-label">Alcance (Carrera)</span>
            <GoogleSelect v-model="form.id_carrera" :options="carreraOptions" placeholder="Global / Todas"
              :disabled="shouldDisableCareer" :hint="careerHint" />
          </div>

          <!-- Activo -->
          <label class="field field-checkbox">
            <input v-model="form.activo" type="checkbox" />
            <span>Usuario activo</span>
          </label>
        </div>
      </form>
    </GoogleModal>

    <ConfirmModal v-model="showDeleteConfirm" title="Eliminar usuario"
      :message="`¿Eliminar el usuario #${deleteTarget?.id_usuario}?`" variant="danger" confirmText="Eliminar"
      @confirm="onDeleteConfirm" />
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useToast } from '../composables/useToast';

import GoogleButton from '../components/ui/button.vue';
import GoogleInput from '../components/ui/input.vue';
import GoogleModal from '../components/modal/modal.vue';
import GoogleTable, { type TableColumn } from '../components/ui/table.vue';
import GoogleSelect, { type SelectOption } from '../components/ui/select.vue';
import GoogleChip from '../components/ui/chip.vue';
import ConfirmModal from '../components/modal/ConfirmModal.vue';

import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  type Usuario,
  type UsuarioPayload,
} from '../services/usuarios';

import { getCarreras, type Carrera } from '../services/carreras';
import { getRoles, type Rol } from '../services/roles';
import { formatCarreraLabel } from '../utils/carreras';

const toast = useToast();
const usuarios = ref<Usuario[]>([]);
const carreras = ref<Carrera[]>([]);
const roles = ref<Rol[]>([]);

const loadingList = ref(false);
const loadingSave = ref(false);
const error = ref<string | null>(null);

const search = ref('');
const isEditing = ref(false);

// Modal
const showFormModal = ref(false);

const showDeleteConfirm = ref(false);
const deleteTarget = ref<Usuario | null>(null);

interface UsuarioForm extends UsuarioPayload {
  id_usuario: number | null;
  password: string;
  id_carrera: number | null;
}

const form = ref<UsuarioForm>({
  id_usuario: null,
  username: '',
  password: '',
  id_rol: 0,
  id_carrera: null,
  activo: true,
});

// Opciones
const rolOptions = computed<SelectOption[]>(() =>
  roles.value.map((r) => ({
    value: r.id_rol,
    label: r.nombre_rol,
  })),
);

const carreraOptions = computed<SelectOption[]>(() => {
  const options: SelectOption[] = [
    { value: null as any, label: 'Global / Administración' }
  ];
  carreras.value.forEach(c => {
    options.push({ value: c.id_carrera, label: formatCarreraLabel(c) });
  });
  return options;
});

// Lógica de restricción de carrera por rol
const shouldDisableCareer = computed(() => {
  const selectedRol = roles.value.find(r => r.id_rol === form.value.id_rol);
  const roleNameLower = selectedRol?.nombre_rol ? String(selectedRol.nombre_rol).toLowerCase() : '';
  // Si es Administrador, forzamos Global (NULL)
  return roleNameLower === 'administrador';
});

const careerHint = computed(() => {
  const selectedRol = roles.value.find(r => r.id_rol === form.value.id_rol);
  const roleNameLower = selectedRol?.nombre_rol ? String(selectedRol.nombre_rol).toLowerCase() : '';
  if (roleNameLower === 'administrador') {
    return 'Administradores siempre tienen acceso global.';
  }
  if (roleNameLower === 'coordinador') {
    return 'Debes asignar una carrera específica.';
  }
  return '';
});

function handleRolChange(val: any) {
  const selectedRol = roles.value.find(r => r.id_rol === val);
  const roleNameLower = selectedRol?.nombre_rol ? String(selectedRol.nombre_rol).toLowerCase() : '';
  if (roleNameLower === 'administrador') {
    form.value.id_carrera = null;
  }
}

function resetForm() {
  const firstRol = roles.value[0];
  form.value = {
    id_usuario: null,
    username: '',
    password: '',
    id_rol: firstRol ? firstRol.id_rol : 0,
    id_carrera: null,
    activo: true,
  };
  isEditing.value = false;
}

// Helpers
function getRolNombre(id_rol: number): string {
  const r = roles.value.find((r) => r.id_rol === id_rol);
  return r ? r.nombre_rol : `ID ${id_rol}`;
}

function getCarreraNombre(id: number | null): string {
  if (id === null) return 'Global';
  const c = carreras.value.find((c) => c.id_carrera === id);
  return c ? formatCarreraLabel(c) : '-';
}

const usuariosActivos = computed(
  () => usuarios.value.filter((u) => u.activo).length,
);

interface UsuarioRow extends Usuario {
  rolNombre: string;
  carreraNombre: string;
  estadoLabel: string;
}

const usuariosRows = computed<UsuarioRow[]>(() =>
  usuarios.value.map((u) => ({
    ...u,
    rolNombre: getRolNombre(u.id_rol),
    carreraNombre: getCarreraNombre(u.id_carrera),
    estadoLabel: u.activo ? 'ACTIVO' : 'INACTIVO',
  })),
);

const usuariosColumns: TableColumn[] = [
  { key: 'id_usuario', label: '#', width: '70px', align: 'left' },
  { key: 'username', label: 'Usuario' },
  { key: 'rolNombre', label: 'Rol' },
  { key: 'carreraNombre', label: 'Alcance/Carrera' },
  { key: 'estadoLabel', label: 'Estado', width: '110px' },
];

async function loadCatalogos() {
  try {
    const [cr, rl] = await Promise.all([getCarreras(), getRoles()]);
    carreras.value = cr;
    roles.value = rl;

    if (!form.value.id_rol) {
      const firstRol = roles.value[0];
      if (firstRol) form.value.id_rol = firstRol.id_rol;
    }
  } catch (e) {
    console.error('Error al cargar catálogos', e);
  }
}

async function loadUsuarios() {
  try {
    error.value = null;
    loadingList.value = true;
    usuarios.value = await getUsuarios();
  } catch (e) {
    console.error(e);
    toast.error('Error al cargar usuarios');
  } finally {
    loadingList.value = false;
  }
}

function openCreateForm() {
  resetForm();
  isEditing.value = false;
  showFormModal.value = true;
}

async function saveUsuario() {
  try {
    error.value = null;
    loadingSave.value = true;

    // Validación según rol
    const selectedRol = roles.value.find(r => r.id_rol === form.value.id_rol);
    const hasCareerAssigned =
      form.value.id_carrera !== null &&
      form.value.id_carrera !== undefined &&
      String(form.value.id_carrera).trim() !== '';

    if (selectedRol?.nombre_rol === 'Coordinador' && !hasCareerAssigned) {
      toast.error('Coordinadores deben tener una carrera asignada.');
      return;
    }

    const payloadBase: UsuarioPayload = {
      username: form.value.username.trim(),
      id_rol: form.value.id_rol,
      id_carrera: form.value.id_carrera,
      activo: form.value.activo,
    };

    const payload: UsuarioPayload =
      form.value.password.trim().length > 0
        ? { ...payloadBase, password: form.value.password }
        : payloadBase;

    if (!payload.username || !payload.id_rol) {
      toast.error('Usuario y rol son obligatorios.');
      return;
    }

    if (isEditing.value && form.value.id_usuario != null) {
      const updated = await updateUsuario(form.value.id_usuario, payload);
      usuarios.value = usuarios.value.map((u) =>
        u.id_usuario === updated.id_usuario ? updated : u,
      );
      toast.success('Usuario actualizado correctamente');
    } else {
      const created = await createUsuario(payload);
      usuarios.value.push(created);
      toast.success('Usuario creado correctamente');
    }

    resetForm();
  } catch (e: any) {
    console.error(e);
    const backendMsg = e?.response?.data?.message ?? e?.message ?? 'Error desconocido';
    toast.error(`Error al guardar el usuario: ${backendMsg}`);
  } finally {
    loadingSave.value = false;
  }
}

async function handleFormSubmit() {
  await saveUsuario();
  if (!error.value) showFormModal.value = false;
}

function handleCancelForm() {
  resetForm();
  showFormModal.value = false;
}

function onEdit(row: Usuario) {
  isEditing.value = true;
  form.value = {
    id_usuario: row.id_usuario,
    username: row.username,
    password: '',
    id_rol: row.id_rol,
    id_carrera: row.id_carrera,
    activo: row.activo,
  };
  showFormModal.value = true;
}

function onDelete(row: Usuario) {
  deleteTarget.value = row;
  showDeleteConfirm.value = true;
}

async function onDeleteConfirm() {
  const row = deleteTarget.value;
  if (!row) return;
  const id_usuario = row.id_usuario;
  try {
    await deleteUsuario(id_usuario);
    usuarios.value = usuarios.value.filter((u) => u.id_usuario !== id_usuario);
    toast.success('Usuario eliminado correctamente');
  } catch (e: any) {
    console.error(e);
    toast.error(`Error al eliminar el usuario: ${e?.message}`);
  } finally {
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
  }
}

onMounted(async () => {
  await Promise.all([loadCatalogos(), loadUsuarios()]);
});
</script>

<style scoped>
.g-page-animate {
  animation: g-fade-in 180ms ease-out;
}

@keyframes g-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.back-to-home {
  margin-bottom: 0.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.page-subtitle {
  font-size: 0.9rem;
  color: var(--md-sys-color-on-surface-variant);
  margin-top: 0.25rem;
}

.page-header-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  font-size: 0.78rem;
  border: 1px solid transparent;
}

.chip-soft {
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface-variant);
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem 1rem;
}

@media (max-width: 600px) {
  .user-form-grid {
    grid-template-columns: 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.85rem;
}

.field-label {
  color: var(--md-sys-color-on-surface-variant);
  font-weight: 500;
}

.field-checkbox {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1.4rem;
}

.hint {
  font-size: 0.75rem;
  color: var(--md-sys-color-outline);
  margin-top: 0.15rem;
}
</style>
