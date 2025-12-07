<!-- src/views/CiclosEscolaresView.vue -->
<template>
  <section class="page">
    <!-- Header estilo Google -->
    <header class="page-header">
      <div>
        <h2 class="page-title">Ciclos escolares</h2>
        <p class="page-subtitle">
          Administra los ciclos escolares activos y anteriores.
        </p>
      </div>
      <div class="page-header-meta">
        <span class="chip chip-soft">
          Total: <strong>{{ ciclos.length }}</strong>
        </span>
        <span
          v-if="cicloActual"
          class="chip chip-primary"
        >
          Ciclo actual: {{ cicloActual.nombre }}
        </span>
      </div>
    </header>

    <!-- Card formulario -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">
            {{ isEditing ? 'Editar ciclo escolar' : 'Nuevo ciclo escolar' }}
          </h3>
          <p class="card-subtitle">
            Registra los rangos de fechas oficiales y marca un ciclo como actual.
          </p>
        </div>
        <span
          v-if="isEditing && editingId !== null"
          class="chip chip-primary"
        >
          Editando: #{{ editingId }}
        </span>
      </div>

      <form @submit.prevent="onSubmit" class="form">
        <div class="form-grid">
          <label class="field">
            <span class="field-label">Nombre del ciclo *</span>
            <input
              v-model="form.nombre"
              required
              class="field-input"
              placeholder="Ej. Ago-Dic 2024"
            />
          </label>

          <label class="field">
            <span class="field-label">Fecha de inicio *</span>
            <input
              v-model="form.fecha_inicio"
              type="date"
              required
              class="field-input"
            />
          </label>

          <label class="field">
            <span class="field-label">Fecha de fin *</span>
            <input
              v-model="form.fecha_fin"
              type="date"
              required
              class="field-input"
            />
          </label>

          <label class="field field-checkbox">
            <input
              v-model="form.es_actual"
              type="checkbox"
            />
            <span>Marcar como ciclo actual</span>
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
                {{ isEditing ? 'Actualizar ciclo' : 'Guardar ciclo' }}
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
              @click="loadCiclos"
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
          <h3 class="card-title">Listado de ciclos escolares</h3>
          <p class="card-subtitle">
            Consulta, edita o elimina ciclos registrados. Se recomienda tener solo
            <strong>un ciclo marcado como actual</strong>.
          </p>
        </div>
        <div class="card-actions">
          <input
            v-model="search"
            class="search-input"
            placeholder="Buscar por nombre..."
          />
        </div>
      </div>

      <div v-if="filteredCiclos.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Actual</th>
              <th class="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in filteredCiclos"
              :key="c.id_ciclo"
              :class="{ 'row-editing': c.id_ciclo === editingId }"
            >
              <td>#{{ c.id_ciclo }}</td>
              <td>{{ c.nombre }}</td>
              <td>{{ formatDate(c.fecha_inicio) }}</td>
              <td>{{ formatDate(c.fecha_fin) }}</td>
              <td>
                <span
                  class="chip"
                  :class="c.es_actual ? 'chip-success' : 'chip-muted'"
                >
                  {{ c.es_actual ? 'Sí' : 'No' }}
                </span>
              </td>
              <td class="cell-actions">
                <button
                  class="icon-button"
                  title="Editar"
                  @click="onEdit(c)"
                >
                  ✏️
                </button>
                <button
                  class="icon-button icon-danger"
                  title="Eliminar"
                  @click="onDelete(c.id_ciclo)"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="empty">
        No hay ciclos que coincidan con el filtro.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  getCiclosEscolares,
  createCicloEscolar,
  updateCicloEscolar,
  deleteCicloEscolar,
  type CicloEscolar,
  type CicloEscolarPayload,
} from '../services/ciclos-escolares';

// ---- STATE ----
const ciclos = ref<CicloEscolar[]>([]);
const loadingList = ref(false);
const loadingSave = ref(false);
const error = ref<string | null>(null);

const isEditing = ref(false);
const editingId = ref<number | null>(null);
const search = ref('');

// Formulario
const form = ref<CicloEscolarPayload>({
  nombre: '',
  fecha_inicio: '',
  fecha_fin: '',
  es_actual: false,
});

// ---- HELPERS ----
function resetForm() {
  form.value = {
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    es_actual: false,
  };
  isEditing.value = false;
  editingId.value = null;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10); // 'YYYY-MM-DD'
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX');
}

// Ciclo actual (para mostrar en chip)
const cicloActual = computed(() =>
  ciclos.value.find((c) => c.es_actual === true) ?? null,
);

const filteredCiclos = computed(() => {
  let list = [...ciclos.value];

  if (search.value.trim()) {
    const term = search.value.toLowerCase();
    list = list.filter((c) =>
      c.nombre.toLowerCase().includes(term),
    );
  }

  // Opcional: ordenar por fecha_inicio descendente
  list.sort((a, b) => (a.fecha_inicio < b.fecha_inicio ? 1 : -1));
  return list;
});

// ---- API CALLS ----
async function loadCiclos() {
  try {
    error.value = null;
    loadingList.value = true;
    ciclos.value = await getCiclosEscolares();
  } catch (e) {
    console.error(e);
    error.value = 'Error al cargar los ciclos escolares';
  } finally {
    loadingList.value = false;
  }
}

async function onSubmit() {
  try {
    error.value = null;
    loadingSave.value = true;

    const payload: CicloEscolarPayload = {
      nombre: form.value.nombre.trim(),
      fecha_inicio: form.value.fecha_inicio,
      fecha_fin: form.value.fecha_fin,
      es_actual: form.value.es_actual,
    };

    let saved: CicloEscolar;

    if (isEditing.value && editingId.value !== null) {
      saved = await updateCicloEscolar(editingId.value, payload);
      ciclos.value = ciclos.value.map((c) =>
        c.id_ciclo === saved.id_ciclo ? saved : c,
      );
    } else {
      saved = await createCicloEscolar(payload);
      ciclos.value.push(saved);
    }

    // Si se marcó como actual, reflejamos en memoria que los otros no lo sean
    if (saved.es_actual) {
      ciclos.value = ciclos.value.map((c) =>
        c.id_ciclo === saved.id_ciclo
          ? c
          : { ...c, es_actual: false },
      );
    }

    resetForm();
  } catch (e: any) {
    console.error(e);
    const backendMsg =
      e?.response?.data?.message ??
      e?.message ??
      'Error desconocido';
    error.value = `No se pudo guardar el ciclo escolar: ${backendMsg}`;
  } finally {
    loadingSave.value = false;
  }
}

function onEdit(ciclo: CicloEscolar) {
  isEditing.value = true;
  editingId.value = ciclo.id_ciclo;

  form.value = {
    nombre: ciclo.nombre,
    fecha_inicio: toDateInputValue(ciclo.fecha_inicio),
    fecha_fin: toDateInputValue(ciclo.fecha_fin),
    es_actual: ciclo.es_actual,
  };
}

function onCancelEdit() {
  resetForm();
}

async function onDelete(id_ciclo: number) {
  if (!confirm(`¿Eliminar el ciclo escolar #${id_ciclo}?`)) return;
  try {
    await deleteCicloEscolar(id_ciclo);
    ciclos.value = ciclos.value.filter((c) => c.id_ciclo !== id_ciclo);
    if (editingId.value === id_ciclo) {
      resetForm();
    }
  } catch (e: any) {
    console.error(e);
    const backendMsg =
      e?.response?.data?.message ??
      e?.message ??
      'Error desconocido';
    error.value = `No se pudo eliminar el ciclo escolar: ${backendMsg}`;
  }
}

onMounted(loadCiclos);
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

/* Hint / mensajes */

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

/* Form actions */

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
</style>
