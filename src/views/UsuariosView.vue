<!-- src/views/UsuariosView.vue -->
<template>
  <section class="page g-page-animate">
    <!-- Botón para volver a Inicio -->
    <div class="back-to-home">
      <RouterLink to="/inicio" custom v-slot="{ navigate }">
        <GoogleButton @click="navigate" color="#1a73e8" size="sm">
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
          Administración de cuentas de acceso, roles y vínculo con alumnos.
        </p>
      </div>

      <div class="page-header-meta">
        <span class="chip chip-soft">
          Usuarios: <strong>{{ usuarios.length }}</strong>
        </span>
        <span class="chip chip-soft">
          Activos:
          <strong>{{ usuariosActivos }}</strong>
        </span>

        <GoogleButton
          size="sm"
          color="#1a73e8"
          @click="openCreateForm"
        >
          <span class="material-symbols-outlined">person_add</span>
          Nuevo usuario
        </GoogleButton>
      </div>
    </header>

    <!-- Tabla genérica googlesca -->
    <GoogleTable
      :rows="usuariosRows"
      :columns="usuariosColumns"
      rowKey="id_usuario"
      :loading="loadingList"
      :error="error"
      v-model:search="search"
      title="Listado de usuarios"
      subtitle="Consulta, edita o elimina usuarios registrados en el sistema."
      icon="manage_accounts"
      :showReload="true"
      :useDefaultActions="true"
      :searchKeys="['username', 'rolNombre', 'matricula_alumno', 'alumnoNombre']"
      :successMessage="tableSuccessMessage"
      emptyMessage="No hay usuarios que coincidan con el filtro."
      @reload="loadUsuarios"
      @edit="onEdit"
      @delete="onDelete"
    />

    <!-- Modal Crear / Editar usuario -->
    <GoogleModal
      v-model="showFormModal"
      :icon="isEditing ? 'manage_accounts' : 'person_add'"
      :title="isEditing ? 'Editar usuario' : 'Nuevo usuario'"
      subtitle="Crea o edita usuarios, asignando roles y, si aplica, vinculándolos a un alumno."
      maxWidth="780px"
      density="comfortable"
      :confirmLoading="loadingSave"
      :confirmText="isEditing ? 'Actualizar usuario' : 'Guardar usuario'"
      cancelText="Cancelar"
      @confirm="handleFormSubmit"
      @cancel="handleCancelForm"
    >
      <form @submit.prevent="handleFormSubmit" class="user-form">
        <div class="user-form-grid">
          <!-- Username -->
          <GoogleInput
            v-model="form.username"
            label="Usuario *"
            placeholder="Ej. admin, juan.perez"
            required
          />

          <!-- Password -->
          <GoogleInput
            v-model="form.password"
            label="Contraseña"
            type="password"
            :hint="isEditing ? 'Déjala en blanco si no quieres cambiarla' : ''"
            :required="!isEditing"
            placeholder="••••••••"
          />

          <!-- Rol (select nativo para no inventar GoogleSelect aquí) -->
          <label class="field">
            <span class="field-label">Rol *</span>
            <select
              v-model.number="form.id_rol"
              class="field-input"
              required
            >
              <option disabled value="0">
                Selecciona un rol
              </option>
              <option
                v-for="r in roles"
                :key="r.id_rol"
                :value="r.id_rol"
              >
                {{ r.nombre_rol }}
              </option>
            </select>
            <small v-if="!roles.length" class="hint">
              No hay roles cargados.
            </small>
          </label>

          <!-- Matrícula vinculada -->
          <label class="field">
            <span class="field-label">Matrícula vinculada (opcional)</span>
            <input
              v-model="form.matricula_alumno"
              list="alumnos-list"
              class="field-input"
              placeholder="Ej. 180054"
            />
            <datalist id="alumnos-list">
              <option
                v-for="al in alumnos"
                :key="al.matricula"
                :value="al.matricula"
              >
                {{ al.matricula }} · {{ al.nombre_completo }}
              </option>
            </datalist>
            <small class="hint">
              Para usuarios tipo alumno, puedes vincular su matrícula.
            </small>
          </label>

          <!-- Activo -->
          <label class="field field-checkbox">
            <input
              v-model="form.activo"
              type="checkbox"
            />
            <span>Usuario activo</span>
          </label>
        </div>
        <!-- Botones los maneja el footer del modal -->
      </form>
    </GoogleModal>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

import GoogleButton from '../components/ui/button.vue';
import GoogleInput from '../components/ui/input.vue';
import GoogleModal from '../components/modal/modal.vue';
import GoogleTable, { type TableColumn } from '../components/ui/table.vue';

import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  type Usuario,
  type UsuarioPayload,
} from '../services/usuarios';

import { getAlumnos, type Alumno } from '../services/alumnos';
import { getRoles, type Rol } from '../services/roles';

const usuarios = ref<Usuario[]>([]);
const alumnos = ref<Alumno[]>([]);
const roles = ref<Rol[]>([]);

const loadingList = ref(false);
const loadingSave = ref(false);
const error = ref<string | null>(null);

const search = ref('');
const isEditing = ref(false);
const tableSuccessMessage = ref<string | null>(null);

// Modal
const showFormModal = ref(false);

interface UsuarioForm extends UsuarioPayload {
  id_usuario: number | null;
  password: string; // solo para el formulario (no viene del backend)
}

const form = ref<UsuarioForm>({
  id_usuario: null,
  username: '',
  password: '',
  id_rol: 0,
  matricula_alumno: '',
  activo: true,
});

function resetForm() {
  const firstRol = roles.value[0];
  form.value = {
    id_usuario: null,
    username: '',
    password: '',
    id_rol: firstRol ? firstRol.id_rol : 0,
    matricula_alumno: '',
    activo: true,
  };
  isEditing.value = false;
}

// Helpers

function getRolNombre(id_rol: number): string {
  const r = roles.value.find((r) => r.id_rol === id_rol);
  return r ? r.nombre_rol : `ID ${id_rol}`;
}

function getAlumnoNombre(matricula: string | null | undefined): string {
  if (!matricula) return '';
  const al = alumnos.value.find((a) => a.matricula === matricula);
  return al ? al.nombre_completo : '';
}

const usuariosActivos = computed(
  () => usuarios.value.filter((u) => u.activo).length,
);

// Filas que se muestran en la GoogleTable (con campos derivados)
interface UsuarioRow extends Usuario {
  rolNombre: string;
  alumnoNombre: string;
  estadoLabel: string;
}

const usuariosRows = computed<UsuarioRow[]>(() =>
  usuarios.value.map((u) => ({
    ...u,
    rolNombre: getRolNombre(u.id_rol),
    alumnoNombre: getAlumnoNombre(u.matricula_alumno),
    estadoLabel: u.activo ? 'ACTIVO' : 'INACTIVO',
  })),
);

// Columnas para GoogleTable
const usuariosColumns: TableColumn[] = [
  { key: 'id_usuario', label: '#', width: '70px', align: 'left' },
  { key: 'username', label: 'Usuario' },
  { key: 'rolNombre', label: 'Rol' },
  { key: 'matricula_alumno', label: 'Matrícula' },
  { key: 'alumnoNombre', label: 'Alumno' },
  { key: 'estadoLabel', label: 'Estado', width: '110px' },
];

// Loaders

async function loadCatalogos() {
  try {
    const [al, rl] = await Promise.all([getAlumnos(), getRoles()]);
    alumnos.value = al;
    roles.value = rl;

    if (!form.value.id_rol) {
      const firstRol = roles.value[0];
      if (firstRol) {
        form.value.id_rol = firstRol.id_rol;
      }
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
    error.value = 'Error al cargar usuarios';
  } finally {
    loadingList.value = false;
  }
}

// Abre modal para nuevo usuario
function openCreateForm() {
  resetForm();
  isEditing.value = false;
  showFormModal.value = true;
}

// Lógica central para guardar/actualizar
async function saveUsuario() {
  try {
    error.value = null;
    loadingSave.value = true;

    const payloadBase: UsuarioPayload = {
      username: form.value.username.trim(),
      id_rol: form.value.id_rol,
      matricula_alumno: form.value.matricula_alumno?.trim() || null,
      activo: form.value.activo,
    };

    const payload: UsuarioPayload =
      form.value.password.trim().length > 0
        ? { ...payloadBase, password: form.value.password }
        : payloadBase;

    if (!payload.username || !payload.id_rol) {
      error.value = 'Usuario y rol son obligatorios.';
      return;
    }

    if (isEditing.value && form.value.id_usuario != null) {
      const updated = await updateUsuario(form.value.id_usuario, payload);
      usuarios.value = usuarios.value.map((u) =>
        u.id_usuario === updated.id_usuario ? updated : u,
      );
      tableSuccessMessage.value = 'Usuario actualizado correctamente';
    } else {
      const created = await createUsuario(payload);
      usuarios.value.push(created);
      tableSuccessMessage.value = 'Usuario creado correctamente';
    }

    resetForm();
  } catch (e: any) {
    console.error(e);
    const backendMsg =
      e?.response?.data?.message ??
      e?.message ??
      'Error desconocido';
    error.value = isEditing.value
      ? `Error al actualizar el usuario: ${backendMsg}`
      : `Error al crear el usuario: ${backendMsg}`;
  } finally {
    loadingSave.value = false;
  }
}

// submit desde el modal
async function handleFormSubmit() {
  await saveUsuario();
  if (!error.value) {
    showFormModal.value = false;
  }
}

// cancelar desde el modal
function handleCancelForm() {
  resetForm();
  showFormModal.value = false;
}

// Editar desde la tabla (GoogleTable @edit pasa la fila completa)
function onEdit(row: Usuario) {
  isEditing.value = true;
  form.value = {
    id_usuario: row.id_usuario,
    username: row.username,
    password: '', // nunca mostramos ni traemos el hash
    id_rol: row.id_rol,
    matricula_alumno: row.matricula_alumno ?? '',
    activo: row.activo,
  };
  showFormModal.value = true;
}

// Eliminar desde la tabla
async function onDelete(row: Usuario) {
  const id_usuario = row.id_usuario;
  if (!confirm(`¿Eliminar usuario #${id_usuario}?`)) return;
  try {
    await deleteUsuario(id_usuario);
    usuarios.value = usuarios.value.filter(
      (u) => u.id_usuario !== id_usuario,
    );
    if (form.value.id_usuario === id_usuario) {
      resetForm();
    }
    tableSuccessMessage.value = 'Usuario eliminado correctamente';
  } catch (e: any) {
    console.error(e);
    const backendMsg =
      e?.response?.data?.message ??
      e?.message ??
      'Error desconocido';
    error.value = `Error al eliminar el usuario: ${backendMsg}`;
  }
}

onMounted(async () => {
  await Promise.all([loadCatalogos(), loadUsuarios()]);
});
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Animación suave tipo Google */
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
  color: #202124;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #5f6368;
  margin-top: 0.25rem;
}

.page-header-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* Chips */

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  font-size: 0.78rem;
  border: 1px solid transparent;
}

.chip-soft {
  background: #f1f3f4;
  color: #5f6368;
}

.chip-primary {
  background: #e8f0fe;
  border-color: #d2e3fc;
  color: #1a73e8;
}

.chip-success {
  background: #e6f4ea;
  border-color: #c8e6c9;
  color: #1e8e3e;
}

.chip-muted {
  background: #f1f3f4;
  border-color: #e0e0e0;
  color: #5f6368;
}

/* Formulario dentro del modal */

.user-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem 1rem;
}

@media (max-width: 900px) {
  .user-form-grid {
    grid-template-columns: 1fr;
  }
}

/* Campos extra (para select nativo y checkbox) */

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.field-label {
  color: #5f6368;
}

.field-input {
  padding: 0.45rem 0.6rem;
  border-radius: 8px;
  border: 1px solid #dadce0;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  background-color: #ffffff;
}

.field-input:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 1px rgba(26, 115, 232, 0.2);
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
  color: #a0a4a8;
  margin-top: 0.15rem;
}
</style>
