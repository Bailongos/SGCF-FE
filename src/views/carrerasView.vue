<!-- src/views/CarrerasView.vue -->
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
        <h2 class="page-title">Carreras</h2>
        <p class="page-subtitle">
          Administración de las carreras académicas y su duración en semestres.
        </p>
      </div>

      <div class="page-header-meta">
        <span class="chip chip-soft">
          Total: <strong>{{ carreras.length }}</strong>
        </span>

        <GoogleButton
          size="sm"
          color="#1a73e8"
          @click="openCreateForm"
        >
          <span class="material-symbols-outlined">add</span>
          Nueva carrera
        </GoogleButton>
      </div>
    </header>

    <!-- Tabla genérica googlesca -->
    <GoogleTable
      :rows="carreras"
      :columns="carreraColumns"
      rowKey="id_carrera"
      :loading="loadingList"
      :error="error"
      v-model:search="search"
      title="Listado de carreras"
      subtitle="Consulta y gestiona las carreras actuales."
      icon="school"
      :showReload="true"
      :useDefaultActions="true"
      :searchKeys="['nombre']"
      :successMessage="tableSuccessMessage"
      @reload="loadCarreras"
    />

    <!-- Modal Crear / Editar carrera -->
    <GoogleModal
      v-model="showFormModal"
      :icon="isEditing ? 'edit' : 'school'"
      :title="isEditing ? 'Editar carrera' : 'Nueva carrera'"
      subtitle="Define el nombre y la duración oficial de la carrera."
      maxWidth="520px"
      density="comfortable"
      :confirmLoading="loadingSave"
      :confirmText="isEditing ? 'Actualizar' : 'Guardar'"
      cancelText="Cancelar"
      @confirm="handleFormSubmit"
      @cancel="handleCancelForm"
    >
      <form @submit.prevent="handleFormSubmit" class="carrera-form">
        <div class="carrera-form-grid">
          <GoogleInput
            v-model="form.nombre"
            label="Nombre de la carrera *"
            placeholder="Ej. Ingeniería en Sistemas"
            required
          />

          <GoogleInput
            v-model="form.duracion_semestres"
            label="Duración (semestres) *"
            type="number"
            min="1"
            required
          />
        </div>
        <!-- No botones aquí: usamos el footer del modal -->
      </form>
    </GoogleModal>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

import GoogleButton from '../components/ui/button.vue';
import GoogleInput from '../components/ui/input.vue';
import GoogleModal from '../components/modal/modal.vue';
import GoogleTable from '../components/ui/table.vue';
import type { TableColumn } from '../components/ui/table.vue';

import {
  getCarreras,
  createCarrera,
  updateCarrera,
  deleteCarrera,
  type Carrera,
  type CarreraCreate,
} from '../services/carreras';

// ---------- Estado principal ----------
const carreras = ref<Carrera[]>([]);
const loadingList = ref(false);
const loadingSave = ref(false);
const error = ref<string | null>(null);

const isEditing = ref(false);
const editingId = ref<number | null>(null);
const search = ref('');

// mensaje de éxito para el toast interno de la tabla
const tableSuccessMessage = ref<string | null>(null);

// Modal formulario
const showFormModal = ref(false);

// Formulario carrera
const form = ref<CarreraCreate>({
  nombre: '',
  duracion_semestres: 8,
});

// Columnas para GoogleTable (tipadas)
const carreraColumns: TableColumn[] = [
  { key: 'id_carrera', label: 'ID', width: '80px', align: 'left' },
  { key: 'nombre', label: 'Nombre' },
  {
    key: 'duracion_semestres',
    label: 'Semestres',
    width: '110px',
    align: 'center',
  },
];

// ---------- Helpers ----------
const resetForm = () => {
  form.value = {
    nombre: '',
    duracion_semestres: 8,
  };
  isEditing.value = false;
  editingId.value = null;
};

// ---------- Carga de datos ----------
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

// Abre modal para nueva carrera
function openCreateForm() {
  resetForm();
  isEditing.value = false;
  showFormModal.value = true;
}

// Guarda/actualiza (lógica central)
async function saveCarrera() {
  try {
    error.value = null;
    loadingSave.value = true;

    const payload: CarreraCreate = {
      nombre: form.value.nombre.trim(),
      duracion_semestres: Number(form.value.duracion_semestres) || 1,
    };

    if (isEditing.value && editingId.value !== null) {
      const updated = await updateCarrera(editingId.value, payload);
      carreras.value = carreras.value.map((c) =>
        c.id_carrera === editingId.value ? updated : c,
      );
      tableSuccessMessage.value = 'Carrera actualizada correctamente';
    } else {
      const created = await createCarrera(payload);
      carreras.value.push(created);
      tableSuccessMessage.value = 'Carrera creada correctamente';
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

// submit desde el modal (botón del footer o Enter dentro del form)
async function handleFormSubmit() {
  await saveCarrera();
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
function onEdit(carrera: Carrera) {
  isEditing.value = true;
  editingId.value = carrera.id_carrera;

  form.value = {
    nombre: carrera.nombre,
    duracion_semestres: carrera.duracion_semestres,
  };

  showFormModal.value = true;
}

// Eliminar desde la tabla
async function onDelete(row: Carrera) {
  const id = row.id_carrera;
  if (!confirm(`¿Eliminar carrera con ID ${id}?`)) return;

  try {
    await deleteCarrera(id);
    carreras.value = carreras.value.filter((c) => c.id_carrera !== id);
    if (editingId.value === id) {
      resetForm();
    }
    tableSuccessMessage.value = 'Carrera eliminada correctamente';
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

.carrera-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.carrera-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem 1rem;
}

@media (max-width: 768px) {
  .carrera-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
