<!-- src/views/CarrerasView.vue -->
<template>
  <section class="page">
    <!-- Botón para volver a Inicio -->
    <div class="back-to-home">
        <RouterLink to="/inicio" class="btn btn-secondary">
            <span class="material-symbols-outlined">arrow_back</span>
            Volver a Inicio
        </RouterLink>
    </div>
    <header class="page-header">
      <div>
        <h2 class="page-title">Carreras</h2>
        <p class="page-subtitle">
          Administración de las carreras académicas y su duración en semestres.
        </p>
      </div>
      <div class="page-header-meta">
        <span class="chip chip-soft">
          Total: <strong>{{ carreras.length }}</strong>
        </span>
      </div>
    </header>

    <!-- Formulario -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">
            {{ isEditing ? 'Editar carrera' : 'Nueva carrera' }}
          </h3>
          <p class="card-subtitle">
            Define el nombre y la duración oficial de la carrera.
          </p>
        </div>
        <span
          v-if="isEditing && editingId !== null"
          class="chip chip-primary"
        >
          Editando ID: {{ editingId }}
        </span>
      </div>

      <form @submit.prevent="onSubmit" class="form">
        <div class="form-grid">
          <label class="field">
            <span class="field-label">Nombre *</span>
            <input
              v-model="form.nombre"
              required
              class="field-input"
              placeholder="Ej. Ingeniería en Sistemas"
            />
          </label>

          <label class="field">
            <span class="field-label">Duración (semestres) *</span>
            <input
              v-model.number="form.duracion_semestres"
              type="number"
              min="1"
              required
              class="field-input"
            />
          </label>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="loadingSave"
          >
            <span v-if="loadingSave">Guardando...</span>
            <span v-else>
              {{ isEditing ? 'Actualizar carrera' : 'Guardar carrera' }}
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
      </form>
    </div>

    <!-- Listado -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Listado de carreras</h3>
          <p class="card-subtitle">
            Consulta y gestiona las carreras actuales.
          </p>
        </div>
        <div class="card-actions">
          <input
            v-model="search"
            class="search-input"
            placeholder="Buscar por nombre..."
          />
          <button
            class="btn btn-text"
            @click="loadCarreras"
            :disabled="loadingList"
          >
            Recargar
          </button>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div v-if="filteredCarreras.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Semestres</th>
              <th class="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in filteredCarreras"
              :key="c.id_carrera"
              :class="{ 'row-editing': c.id_carrera === editingId }"
            >
              <td>{{ c.id_carrera }}</td>
              <td>{{ c.nombre }}</td>
              <td>{{ c.duracion_semestres }}</td>
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
                  @click="onDelete(c.id_carrera)"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="empty">
        No hay carreras que coincidan con el filtro.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  getCarreras,
  createCarrera,
  updateCarrera,
  deleteCarrera,
  type Carrera,
  type CarreraCreate,
} from '../services/carreras';

const carreras = ref<Carrera[]>([]);
const loadingList = ref(false);
const loadingSave = ref(false);
const error = ref<string | null>(null);

const isEditing = ref(false);
const editingId = ref<number | null>(null);
const search = ref('');

const form = ref<CarreraCreate>({
  nombre: '',
  duracion_semestres: 8,
});

const resetForm = () => {
  form.value = {
    nombre: '',
    duracion_semestres: 8,
  };
  isEditing.value = false;
  editingId.value = null;
};

const filteredCarreras = computed(() => {
  if (!search.value.trim()) return carreras.value;
  const term = search.value.toLowerCase();
  return carreras.value.filter((c) =>
    c.nombre.toLowerCase().includes(term),
  );
});

async function loadCarreras() {
  try {
    error.value = null;
    loadingList.value = true;
    carreras.value = await getCarreras();
  } catch (e) {
    console.error(e);
    error.value = 'Error al cargar carreras';
  } finally {
    loadingList.value = false;
  }
}

async function onSubmit() {
  try {
    error.value = null;
    loadingSave.value = true;

    if (isEditing.value && editingId.value !== null) {
      const updated = await updateCarrera(editingId.value, form.value);
      carreras.value = carreras.value.map((c) =>
        c.id_carrera === editingId.value ? updated : c,
      );
    } else {
      const created = await createCarrera(form.value);
      carreras.value.push(created);
    }

    resetForm();
  } catch (e) {
    console.error(e);
    error.value = isEditing.value
      ? 'Error al actualizar carrera'
      : 'Error al crear carrera';
  } finally {
    loadingSave.value = false;
  }
}

function onEdit(carrera: Carrera) {
  isEditing.value = true;
  editingId.value = carrera.id_carrera;

  form.value = {
    nombre: carrera.nombre,
    duracion_semestres: carrera.duracion_semestres,
  };
}

function onCancelEdit() {
  resetForm();
}

async function onDelete(id: number) {
  if (!confirm(`¿Eliminar carrera con ID ${id}?`)) return;
  try {
    await deleteCarrera(id);
    carreras.value = carreras.value.filter((c) => c.id_carrera !== id);
    if (editingId.value === id) {
      resetForm();
    }
  } catch (e) {
    console.error(e);
    error.value = 'Error al eliminar carrera';
  }
}

onMounted(loadCarreras);
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
  grid-template-columns: repeat(2, minmax(0, 260px));
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
}

.field-input:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 1px rgba(26, 115, 232, 0.2);
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
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
  min-width: 220px;
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
