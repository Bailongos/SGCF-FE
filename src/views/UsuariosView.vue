<template>
  <section class="page">
    <!-- Botón para volver a Inicio -->
    <div class="back-to-home">
        <RouterLink to="/inicio" class="btn btn-secondary">
            <span class="material-symbols-outlined">arrow_back</span>
            Volver a Inicio
        </RouterLink>
    </div>
    <!-- Header -->
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
      </div>
    </header>

    <!-- Card formulario -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">
            {{ isEditing ? 'Editar usuario' : 'Nuevo usuario' }}
          </h3>
          <p class="card-subtitle">
            Crea o edita usuarios, asignando roles y, si aplica, vinculándolos
            a un alumno.
          </p>
        </div>
        <span
          v-if="isEditing && form.id_usuario"
          class="chip chip-primary"
        >
          Editando: #{{ form.id_usuario }}
        </span>
      </div>

      <form @submit.prevent="onSubmit" class="form">
        <div class="form-grid">
          <!-- Username -->
          <label class="field">
            <span class="field-label">Usuario *</span>
            <input
              v-model="form.username"
              required
              class="field-input"
              placeholder="Ej. admin, juan.perez"
            />
          </label>

          <!-- Password -->
          <label class="field">
            <span class="field-label">
              Contraseña
              <small v-if="isEditing">(deja en blanco para no cambiarla)</small>
            </span>
            <input
              v-model="form.password"
              type="password"
              class="field-input"
              :required="!isEditing"
              placeholder="••••••••"
            />
          </label>

          <!-- Rol -->
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

          <!-- Matrícula (opcional) -->
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

        <div class="form-actions">
          <div class="form-actions-left">
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="loadingSave"
            >
              <span v-if="loadingSave">Guardando...</span>
              <span v-else>
                {{ isEditing ? 'Actualizar usuario' : 'Guardar usuario' }}
              </span>
            </button>

            <button
              v-if="isEditing"
              type="button"
              class="btn btn-text"
              @click="onCancelEdit"
            >
              Cancelar edición
            </button>
          </div>

          <div class="form-actions-right">
            <button
              type="button"
              class="btn btn-text"
              @click="loadUsuarios"
              :disabled="loadingList"
            >
              Recargar
            </button>
          </div>
        </div>
      </form>

      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <!-- Card listado -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Listado de usuarios</h3>
          <p class="card-subtitle">
            Consulta, edita o elimina usuarios registrados en el sistema.
          </p>
        </div>
        <div class="card-actions">
          <input
            v-model="search"
            class="search-input"
            placeholder="Buscar por usuario, rol o alumno..."
          />
        </div>
      </div>

      <div v-if="filteredUsuarios.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Matrícula</th>
              <th>Alumno</th>
              <th>Estado</th>
              <th class="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in filteredUsuarios"
              :key="u.id_usuario"
              :class="{ 'row-editing': u.id_usuario === form.id_usuario }"
            >
              <td>#{{ u.id_usuario }}</td>
              <td>{{ u.username }}</td>
              <td>{{ getRolNombre(u.id_rol) }}</td>
              <td>{{ u.matricula_alumno ?? '' }}</td>
              <td>{{ getAlumnoNombre(u.matricula_alumno) }}</td>
              <td>
                <span
                  class="chip"
                  :class="u.activo ? 'chip-success' : 'chip-muted'"
                >
                  {{ u.activo ? 'ACTIVO' : 'INACTIVO' }}
                </span>
              </td>
              <td class="cell-actions">
                <button
                  class="icon-button"
                  title="Editar"
                  @click="onEdit(u)"
                >
                  ✏️
                </button>
                <button
                  class="icon-button icon-danger"
                  title="Eliminar"
                  @click="onDelete(u.id_usuario)"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="empty">
        No hay usuarios que coincidan con el filtro.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
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

interface UsuarioForm extends UsuarioPayload {
  id_usuario: number | null;
  password: string; // solo para el formulario, no viene del backend
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
  form.value = {
    id_usuario: null,
    username: '',
    password: '',
    id_rol: roles.value[0]?.id_rol ?? 0,
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

// Computed listado + filtro

const filteredUsuarios = computed(() => {
  if (!search.value.trim()) return usuarios.value;
  const term = search.value.toLowerCase();

  return usuarios.value.filter((u) => {
    const rol = getRolNombre(u.id_rol).toLowerCase();
    const alumno = getAlumnoNombre(u.matricula_alumno).toLowerCase();
    return (
      u.username.toLowerCase().includes(term) ||
      rol.includes(term) ||
      (u.matricula_alumno ?? '').toLowerCase().includes(term) ||
      alumno.includes(term)
    );
  });
});

// Loaders

async function loadCatalogos() {
  try {
    const [al, rl] = await Promise.all([
      getAlumnos(),
      getRoles(),
    ]);

    alumnos.value = al;
    roles.value = rl;

    if (!form.value.id_rol && roles.value.length) {
      form.value.id_rol = roles.value[0].id_rol;
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

// CRUD

async function onSubmit() {
  try {
    error.value = null;
    loadingSave.value = true;

    const payloadBase: UsuarioPayload = {
      username: form.value.username.trim(),
      id_rol: form.value.id_rol,
      matricula_alumno: form.value.matricula_alumno?.trim() || null,
      activo: form.value.activo,
    };

    // Solo mandamos password si el campo no viene vacío
    const payload: UsuarioPayload =
      form.value.password.trim().length > 0
        ? { ...payloadBase, password: form.value.password }
        : payloadBase;

    if (isEditing.value && form.value.id_usuario != null) {
      const updated = await updateUsuario(form.value.id_usuario, payload);
      usuarios.value = usuarios.value.map((u) =>
        u.id_usuario === updated.id_usuario ? updated : u,
      );
    } else {
      const created = await createUsuario(payload);
      usuarios.value.push(created);
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

function onEdit(u: Usuario) {
  isEditing.value = true;
  form.value = {
    id_usuario: u.id_usuario,
    username: u.username,
    password: '', // nunca mostramos ni traemos el hash
    id_rol: u.id_rol,
    matricula_alumno: u.matricula_alumno ?? '',
    activo: u.activo,
  };
}

function onCancelEdit() {
  resetForm();
}

async function onDelete(id_usuario: number) {
  if (!confirm(`¿Eliminar usuario #${id_usuario}?`)) return;
  try {
    await deleteUsuario(id_usuario);
    usuarios.value = usuarios.value.filter(
      (u) => u.id_usuario !== id_usuario,
    );
    if (form.value.id_usuario === id_usuario) {
      resetForm();
    }
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
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 500;
  color: #202124;
}

.card-subtitle {
  font-size: 0.85rem;
  color: #5f6368;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Formulario */

.form {
  margin-top: 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem 1rem;
}

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

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.form-actions-left,
.form-actions-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Botones */

.btn {
  border-radius: 999px;
  border: none;
  font-size: 0.9rem;
  padding: 0.45rem 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.btn-primary {
  background: #1a73e8;
  color: #ffffff;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: default;
}

.btn-text {
  background: transparent;
  color: #1a73e8;
}

.btn-text:hover {
  background: rgba(26, 115, 232, 0.08);
}

/* Search */

.search-input {
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  border: 1px solid #dadce0;
  font-size: 0.85rem;
  min-width: 260px;
  outline: none;
}

.search-input:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 1px rgba(26, 115, 232, 0.2);
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

.chip-warning {
  background: #fef7e0;
  border-color: #fbc02d;
  color: #8d6e00;
}

.chip-muted {
  background: #f1f3f4;
  border-color: #e0e0e0;
  color: #5f6368;
}

/* Tabla */

.table-wrapper {
  margin-top: 0.75rem;
  border-radius: 12px;
  border: 1px solid #dadce0;
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
}

.table th,
.table td {
  padding: 0.55rem 0.75rem;
  font-size: 0.85rem;
}

.table thead {
  background: #f8f9fa;
}

.table th {
  text-align: left;
  font-weight: 500;
  color: #5f6368;
  border-bottom: 1px solid #dadce0;
}

.table td {
  border-bottom: 1px solid #f1f3f4;
  color: #202124;
}

.row-editing {
  background: #e8f0fe;
}

.col-actions {
  width: 80px;
}

.cell-actions {
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
}

/* Icon buttons */

.icon-button {
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 999px;
  padding: 0.25rem 0.4rem;
  font-size: 0.9rem;
}

.icon-button:hover {
  background: rgba(60, 64, 67, 0.08);
}

.icon-danger {
  color: #d93025;
}

.icon-danger:hover {
  background: rgba(217, 48, 37, 0.12);
}

/* Mensajes */

.error {
  color: #d93025;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.empty {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: #5f6368;
}
</style>
