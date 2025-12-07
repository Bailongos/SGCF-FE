<template>
  <section class="page">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h2 class="page-title">Observaciones</h2>
        <p class="page-subtitle">
          Registro de observaciones por alumno y usuario.
        </p>
      </div>

      <div class="page-header-meta">
        <span class="chip chip-soft">
          Total: <strong>{{ observaciones.length }}</strong>
        </span>
      </div>
    </header>

    <!-- Card formulario -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">
            {{ isEditing ? 'Editar observación' : 'Nueva observación' }}
          </h3>
          <p class="card-subtitle">
            Relaciona una observación con un alumno y, opcionalmente, con el usuario que la registra.
          </p>
        </div>
        <span
          v-if="isEditing && form.id_observacion"
          class="chip chip-primary"
        >
          Editando: #{{ form.id_observacion }}
        </span>
      </div>

      <form @submit.prevent="onSubmit" class="form">
        <div class="form-grid">
          <!-- Matrícula / alumno -->
          <label class="field">
            <span class="field-label">Matrícula *</span>
            <input
              v-model="form.matricula"
              list="alumnos-list"
              required
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
            <small v-if="!alumnos.length" class="hint">
              No hay alumnos cargados.
            </small>
          </label>

          <!-- Autor (usuario) -->
          <label class="field">
            <span class="field-label">Autor</span>
            <select
              v-model.number="form.id_autor"
              class="field-input"
            >
              <option :value="0">Sin especificar</option>
              <option
                v-for="u in usuarios"
                :key="u.id_usuario"
                :value="u.id_usuario"
              >
                {{ u.username }}
              </option>
            </select>
            <small v-if="!usuarios.length" class="hint">
              No hay usuarios cargados.
            </small>
          </label>

          <!-- Fecha (solo lectura, viene del backend) -->
          <label class="field">
            <span class="field-label">Fecha (solo lectura)</span>
            <input
              class="field-input field-input-readonly"
              :value="form.fecha ? formatDate(form.fecha) : 'Se asigna automáticamente'"
              readonly
            />
          </label>

          <!-- Detalle -->
          <label class="field field-full">
            <span class="field-label">Detalle *</span>
            <textarea
              v-model="form.detalle"
              required
              class="field-input field-textarea"
              rows="3"
              placeholder="Escribe aquí la observación..."
            ></textarea>
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
                {{ isEditing ? 'Actualizar observación' : 'Guardar observación' }}
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
              @click="loadObservaciones"
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
          <h3 class="card-title">Listado de observaciones</h3>
          <p class="card-subtitle">
            Consulta, edita o elimina observaciones registradas.
          </p>
        </div>
        <div class="card-actions">
          <input
            v-model="search"
            class="search-input"
            placeholder="Buscar por matrícula, alumno, autor o texto..."
          />
        </div>
      </div>

      <div v-if="filteredObservaciones.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Matrícula</th>
              <th>Alumno</th>
              <th>Autor</th>
              <th>Detalle</th>
              <th>Fecha</th>
              <th class="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="obs in filteredObservaciones"
              :key="obs.id_observacion"
              :class="{ 'row-editing': obs.id_observacion === form.id_observacion }"
            >
              <td>#{{ obs.id_observacion }}</td>
              <td>{{ obs.matricula }}</td>
              <td>{{ getAlumnoNombre(obs.matricula) }}</td>
              <td>{{ getAutorNombre(obs.id_autor) }}</td>
              <td class="cell-detalle">
                {{ obs.detalle }}
              </td>
              <td>{{ formatDate(obs.fecha) }}</td>
              <td class="cell-actions">
                <button
                  class="icon-button"
                  title="Editar"
                  @click="onEdit(obs)"
                >
                  ✏️
                </button>
                <button
                  class="icon-button icon-danger"
                  title="Eliminar"
                  @click="onDelete(obs.id_observacion)"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="empty">
        No hay observaciones que coincidan con el filtro.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  getObservaciones,
  createObservacion,
  updateObservacion,
  deleteObservacion,
  type Observacion,
  type ObservacionPayload,
} from '../services/observaciones';

import { getAlumnos, type Alumno } from '../services/alumnos';
import { getUsuarios, type Usuario } from '../services/usuarios';

const observaciones = ref<Observacion[]>([]);
const alumnos = ref<Alumno[]>([]);
const usuarios = ref<Usuario[]>([]);

const loadingList = ref(false);
const loadingSave = ref(false);
const error = ref<string | null>(null);

const search = ref('');
const isEditing = ref(false);

interface ObservacionForm extends ObservacionPayload {
  id_observacion: number | null;
  // para mostrar fecha de backend en el formulario
  fecha: string | null;
}

const form = ref<ObservacionForm>({
  id_observacion: null,
  matricula: '',
  detalle: '',
  id_autor: null,
  fecha: null,
});

function resetForm() {
  form.value = {
    id_observacion: null,
    matricula: '',
    detalle: '',
    id_autor: null,
    fecha: null,
  };
  isEditing.value = false;
}

// Helpers

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  // Se asume formato ISO: YYYY-MM-DD...
  return iso.slice(0, 10);
}

function getAlumnoNombre(matricula: string): string {
  const al = alumnos.value.find((a) => a.matricula === matricula);
  return al ? al.nombre_completo : '';
}

function getAutorNombre(id_autor: number | null): string {
  if (!id_autor) return '';
  const u = usuarios.value.find((u) => u.id_usuario === id_autor);
  return u ? u.username : `ID ${id_autor}`;
}

// Computed

const filteredObservaciones = computed(() => {
  if (!search.value.trim()) return observaciones.value;
  const term = search.value.toLowerCase();
  return observaciones.value.filter((o) => {
    const alumno = getAlumnoNombre(o.matricula).toLowerCase();
    const autor = getAutorNombre(o.id_autor).toLowerCase();
    return (
      o.matricula.toLowerCase().includes(term) ||
      alumno.includes(term) ||
      autor.includes(term) ||
      o.detalle.toLowerCase().includes(term)
    );
  });
});

// Loaders

async function loadCatalogos() {
  try {
    const [al, us] = await Promise.all([getAlumnos(), getUsuarios()]);
    alumnos.value = al;
    usuarios.value = us;
  } catch (e) {
    console.error('Error al cargar catálogos para observaciones', e);
  }
}

async function loadObservaciones() {
  try {
    error.value = null;
    loadingList.value = true;
    observaciones.value = await getObservaciones();
  } catch (e) {
    console.error(e);
    error.value = 'Error al cargar observaciones';
  } finally {
    loadingList.value = false;
  }
}

// CRUD

async function onSubmit() {
  try {
    error.value = null;
    loadingSave.value = true;

    const payload: ObservacionPayload = {
      matricula: form.value.matricula.trim(),
      detalle: form.value.detalle.trim(),
      // si es 0 en el select, lo mandamos como null
      id_autor:
        form.value.id_autor && form.value.id_autor > 0
          ? form.value.id_autor
          : null,
    };

    if (!payload.matricula || !payload.detalle) {
      error.value = 'Matrícula y detalle son obligatorios.';
      loadingSave.value = false;
      return;
    }

    if (isEditing.value && form.value.id_observacion != null) {
      const updated = await updateObservacion(
        form.value.id_observacion,
        payload,
      );
      observaciones.value = observaciones.value.map((o) =>
        o.id_observacion === updated.id_observacion ? updated : o,
      );
    } else {
      const created = await createObservacion(payload);
      observaciones.value.push(created);
    }

    resetForm();
  } catch (e: any) {
    console.error(e);
    const backendMsg =
      e?.response?.data?.message ?? e?.message ?? 'Error desconocido';
    error.value = isEditing.value
      ? `Error al actualizar la observación: ${backendMsg}`
      : `Error al crear la observación: ${backendMsg}`;
  } finally {
    loadingSave.value = false;
  }
}

function onEdit(obs: Observacion) {
  isEditing.value = true;
  form.value = {
    id_observacion: obs.id_observacion,
    matricula: obs.matricula,
    detalle: obs.detalle,
    id_autor: obs.id_autor,
    fecha: obs.fecha ?? null,
  };
}

function onCancelEdit() {
  resetForm();
}

async function onDelete(id_observacion: number) {
  if (!confirm(`¿Eliminar observación #${id_observacion}?`)) return;
  try {
    await deleteObservacion(id_observacion);
    observaciones.value = observaciones.value.filter(
      (o) => o.id_observacion !== id_observacion,
    );
    if (form.value.id_observacion === id_observacion) {
      resetForm();
    }
  } catch (e: any) {
    console.error(e);
    const backendMsg =
      e?.response?.data?.message ?? e?.message ?? 'Error desconocido';
    error.value = `Error al eliminar la observación: ${backendMsg}`;
  }
}

onMounted(async () => {
  await Promise.all([loadCatalogos(), loadObservaciones()]);
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

.field-full {
  grid-column: 1 / -1;
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

.field-input-readonly {
  background: #f8f9fa;
  color: #5f6368;
}

.field-textarea {
  resize: vertical;
  min-height: 80px;
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
  vertical-align: top;
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
  width: 90px;
}

.cell-actions {
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
}

.cell-detalle {
  max-width: 360px;
  white-space: pre-wrap;
  word-break: break-word;
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
