<!-- src/views/ObservacionesView.vue -->
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
        <h2 class="page-title">Observaciones</h2>
        <p class="page-subtitle">
          Registro de observaciones por alumno y usuario.
        </p>
      </div>

      <div class="page-header-meta">
        <span class="chip chip-soft">
          Total: <strong>{{ observaciones.length }}</strong>
        </span>

        <GoogleButton
          size="sm"
          color="#1a73e8"
          @click="openCreateForm"
        >
          <span class="material-symbols-outlined">add</span>
          Nueva observación
        </GoogleButton>
      </div>
    </header>

    <!-- Tabla genérica googlesca -->
    <GoogleTable
      :rows="tableRows"
      :columns="observacionesColumns"
      rowKey="id_observacion"
      :loading="loadingList"
      :error="error"
      v-model:search="search"
      title="Listado de observaciones"
      subtitle="Consulta, edita o elimina observaciones registradas."
      icon="speaker_notes"
      :showReload="true"
      :useDefaultActions="true"
      :searchKeys="['matricula', 'alumno_nombre', 'autor_nombre', 'detalle']"
      :successMessage="tableSuccessMessage"
      emptyMessage="No hay observaciones que coincidan con el filtro."
      @reload="loadObservaciones"
      @edit="onEdit"
      @delete="onDelete"
    />

    <!-- Modal Crear / Editar observación -->
    <GoogleModal
      v-model="showFormModal"
      :icon="isEditing ? 'edit_note' : 'note_add'"
      :title="isEditing ? 'Editar observación' : 'Nueva observación'"
      subtitle="Relaciona una observación con un alumno y, opcionalmente, con el usuario que la registra."
      maxWidth="780px"
      density="comfortable"
      :confirmLoading="loadingSave"
      :confirmText="isEditing ? 'Actualizar' : 'Guardar'"
      cancelText="Cancelar"
      @confirm="handleFormSubmit"
      @cancel="handleCancelForm"
    >
      <form @submit.prevent="handleFormSubmit" class="obs-form">
        <div class="obs-form-grid">
          <!-- Matrícula / alumno -->
          <div class="field">
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
          </div>

          <!-- Autor (texto + sugerencias) -->
          <div class="field">
            <span class="field-label">Autor</span>
            <input
              v-model="form.autorTexto"
              list="usuarios-list"
              class="field-input"
              placeholder="Escribe un usuario o texto libre..."
            />
            <datalist id="usuarios-list">
              <option
                v-for="u in usuarios"
                :key="u.id_usuario"
                :value="u.username"
              >
                {{ u.username }}
              </option>
            </datalist>
            <small v-if="!usuarios.length" class="hint">
              No hay usuarios cargados.
            </small>
            <small class="hint">
              Si el texto coincide con un usuario, se vincula; si no, se guarda sin autor.
            </small>
          </div>

          <!-- Fecha (solo lectura, viene del backend) -->
          <div class="field">
            <span class="field-label">Fecha (solo lectura)</span>
            <input
              class="field-input field-input-readonly"
              :value="form.fecha ? formatDate(form.fecha) : 'Se asigna automáticamente'"
              readonly
            />
          </div>

          <!-- Detalle -->
          <div class="field field-full">
            <span class="field-label">Detalle *</span>
            <textarea
              v-model="form.detalle"
              required
              class="field-input field-textarea"
              rows="3"
              placeholder="Escribe aquí la observación..."
            ></textarea>
          </div>
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
import GoogleModal from '../components/modal/modal.vue';
import GoogleTable, { type TableColumn } from '../components/ui/table.vue';

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

// mensajes de éxito dentro de la tabla
const tableSuccessMessage = ref<string | null>(null);

// Modal formulario
const showFormModal = ref(false);

interface ObservacionForm {
  id_observacion: number | null;
  matricula: string;
  detalle: string;
  id_autor: number | null;
  fecha: string | null;
  autorTexto: string; // lo que escribe el usuario en el input de autor
}

const form = ref<ObservacionForm>({
  id_observacion: null,
  matricula: '',
  detalle: '',
  id_autor: null,
  fecha: null,
  autorTexto: '',
});

function resetForm() {
  form.value = {
    id_observacion: null,
    matricula: '',
    detalle: '',
    id_autor: null,
    fecha: null,
    autorTexto: '',
  };
  isEditing.value = false;
}

// Helpers

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
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

// Filas para la tabla (enriquecidas con nombres)
const tableRows = computed(() =>
  observaciones.value.map((o) => ({
    ...o,
    alumno_nombre: getAlumnoNombre(o.matricula),
    autor_nombre: getAutorNombre(o.id_autor ?? null),
    fecha_corta: formatDate(o.fecha ?? null),
  })),
);

// Columnas para GoogleTable
const observacionesColumns: TableColumn[] = [
  { key: 'id_observacion', label: '#', width: '70px', align: 'left' },
  { key: 'matricula', label: 'Matrícula' },
  { key: 'alumno_nombre', label: 'Alumno' },
  { key: 'autor_nombre', label: 'Autor' },
  { key: 'detalle', label: 'Detalle' },
  { key: 'fecha_corta', label: 'Fecha', width: '110px' },
];

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

// Abre modal para nueva observación
function openCreateForm() {
  resetForm();
  isEditing.value = false;
  showFormModal.value = true;
}

// CRUD

async function saveObservacion() {
  try {
    error.value = null;
    loadingSave.value = true;

    // intentar matchear el texto con un usuario existente
    const autorTexto = form.value.autorTexto.trim();
    let autorId: number | null = null;

    if (autorTexto) {
      const found = usuarios.value.find(
        (u) => u.username.toLowerCase() === autorTexto.toLowerCase(),
      );
      autorId = found ? found.id_usuario : null;
    }

    const payload: ObservacionPayload = {
      matricula: form.value.matricula.trim(),
      detalle: form.value.detalle.trim(),
      id_autor: autorId,
    };

    if (!payload.matricula || !payload.detalle) {
      error.value = 'Matrícula y detalle son obligatorios.';
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
      tableSuccessMessage.value = 'Observación actualizada correctamente';
    } else {
      const created = await createObservacion(payload);
      observaciones.value.push(created);
      tableSuccessMessage.value = 'Observación creada correctamente';
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

// submit desde el modal (botón footer o Enter en el form)
async function handleFormSubmit() {
  await saveObservacion();
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
function onEdit(row: Observacion) {
  isEditing.value = true;
  const autorNombre = row.id_autor ? getAutorNombre(row.id_autor) : '';
  form.value = {
    id_observacion: row.id_observacion,
    matricula: row.matricula,
    detalle: row.detalle,
    id_autor: row.id_autor ?? null,
    fecha: row.fecha ?? null,
    autorTexto: autorNombre,
  };
  showFormModal.value = true;
}

// Eliminar desde la tabla
async function onDelete(row: Observacion) {
  const id_observacion = row.id_observacion;
  if (!confirm(`¿Eliminar observación #${id_observacion}?`)) return;
  try {
    await deleteObservacion(id_observacion);
    observaciones.value = observaciones.value.filter(
      (o) => o.id_observacion !== id_observacion,
    );
    if (form.value.id_observacion === id_observacion) {
      resetForm();
    }
    tableSuccessMessage.value = 'Observación eliminada correctamente';
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

/* Formulario dentro del modal */

.obs-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.obs-form-grid {
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
</style>
