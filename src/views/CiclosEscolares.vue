<!-- src/views/CiclosEscolaresView.vue -->
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
          Ciclo actual: {{ cicloActual?.nombre }}
        </span>

        <GoogleButton
          size="sm"
          color="#1a73e8"
          @click="openCreateForm"
        >
          <span class="material-symbols-outlined">add</span>
          Nuevo ciclo
        </GoogleButton>
      </div>
    </header>

    <!-- Tabla genérica googlesca -->
    <GoogleTable
      :rows="ciclos"
      :columns="ciclosColumns"
      rowKey="id_ciclo"
      :loading="loadingList"
      :error="error"
      v-model:search="search"
      title="Listado de ciclos escolares"
      subtitle="Consulta, edita o elimina ciclos registrados. Se recomienda tener solo un ciclo marcado como actual."
      icon="date_range"
      :showReload="true"
      :useDefaultActions="true"
      :searchKeys="['nombre']"
      :successMessage="tableSuccessMessage"
      emptyMessage="No hay ciclos que coincidan con el filtro."
      @reload="loadCiclos"
      @edit="onEdit"
      @delete="onDelete"
    />

    <!-- Modal Crear / Editar ciclo con 2 datepickers -->
    <GoogleModal
      v-model="showFormModal"
      :icon="isEditing ? 'edit_calendar' : 'event'"
      :title="isEditing ? 'Editar ciclo escolar' : 'Nuevo ciclo escolar'"
      subtitle="Registra los rangos de fechas oficiales y marca un ciclo como actual."
      maxWidth="620px"
      density="comfortable"
      :confirmLoading="loadingSave"
      :confirmText="isEditing ? 'Actualizar' : 'Guardar'"
      cancelText="Cancelar"
      @confirm="handleFormSubmit"
      @cancel="handleCancelForm"
    >
      <form @submit.prevent="handleFormSubmit" class="ciclo-form">
        <GoogleInput
          v-model="form.nombre"
          label="Nombre del ciclo *"
          placeholder="Ej. Ago-Dic 2024"
          required
        />

        <div class="ciclo-form-dates">
          <GoogleCalendar
            v-model="form.fecha_inicio"
            label="Fecha de inicio *"
            placeholder="Selecciona fecha de inicio"
            clearable
          />
          <GoogleCalendar
            v-model="form.fecha_fin"
            label="Fecha de fin *"
            placeholder="Selecciona fecha de fin"
            clearable
          />
        </div>

        <label class="field-checkbox">
          <input
            v-model="form.es_actual"
            type="checkbox"
          />
          <span>Marcar como ciclo actual</span>
        </label>
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
import GoogleCalendar from '../components/ui/calendar.vue';

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

// para mostrar mensajes de éxito dentro de la tabla (toast interno)
const tableSuccessMessage = ref<string | null>(null);

// Modal formulario
const showFormModal = ref(false);

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

// Columnas para GoogleTable
const ciclosColumns: TableColumn[] = [
  { key: 'id_ciclo', label: '#', width: '70px', align: 'left' },
  { key: 'nombre', label: 'Nombre' },
  {
    key: 'fecha_inicio',
    label: 'Inicio',
    formatter: (row: CicloEscolar) => formatDate(row.fecha_inicio),
  },
  {
    key: 'fecha_fin',
    label: 'Fin',
    formatter: (row: CicloEscolar) => formatDate(row.fecha_fin),
  },
  {
    key: 'es_actual',
    label: 'Actual',
    width: '90px',
    align: 'center',
    formatter: (row: CicloEscolar) => (row.es_actual ? 'Sí' : 'No'),
  },
];

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

// Abre modal para nuevo ciclo
function openCreateForm() {
  resetForm();
  isEditing.value = false;
  showFormModal.value = true;
}

// Lógica central para guardar/actualizar
async function saveCiclo() {
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
      tableSuccessMessage.value = 'Ciclo escolar actualizado correctamente';
    } else {
      saved = await createCicloEscolar(payload);
      ciclos.value.push(saved);
      tableSuccessMessage.value = 'Ciclo escolar creado correctamente';
    }

    // Si se marcó como actual, actualizar el resto
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

// submit desde el modal (botón footer o Enter en el form)
async function handleFormSubmit() {
  await saveCiclo();
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
function onEdit(ciclo: CicloEscolar) {
  isEditing.value = true;
  editingId.value = ciclo.id_ciclo;

  form.value = {
    nombre: ciclo.nombre,
    fecha_inicio: toDateInputValue(ciclo.fecha_inicio),
    fecha_fin: toDateInputValue(ciclo.fecha_fin),
    es_actual: ciclo.es_actual,
  };

  showFormModal.value = true;
}

// Eliminar desde la tabla
async function onDelete(row: CicloEscolar) {
  const id = row.id_ciclo;
  if (!confirm(`¿Eliminar el ciclo escolar #${id}?`)) return;
  try {
    await deleteCicloEscolar(id);
    ciclos.value = ciclos.value.filter((c) => c.id_ciclo !== id);
    if (editingId.value === id) {
      resetForm();
    }
    tableSuccessMessage.value = 'Ciclo escolar eliminado correctamente';
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

.ciclo-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ciclo-form-dates {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .ciclo-form-dates {
    grid-template-columns: 1fr;
  }
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.25rem;
  font-size: 0.9rem;
  color: #5f6368;
}
</style>
