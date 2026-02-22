<!-- src/components/mantenimiento/CarrerasManager.vue -->
<template>
  <section class="page g-page-animate">
    <header class="page-header">
      <div>
        <h2 class="page-title">Planes de Estudio</h2>
        <p class="page-subtitle">
          Administración de los planes de estudio académicos y su duración en semestres.
        </p>
      </div>

      <div class="page-header-meta">
        <span class="chip chip-soft">
          Total: <strong>{{ carreras.length }}</strong>
        </span>

        <GoogleButton size="sm" color="#1a73e8" @click="openCreateForm">
          <span class="material-symbols-outlined">add</span>
          Nueva carrera
        </GoogleButton>
      </div>
    </header>

    <GoogleTable :rows="carreras" :columns="carreraColumns" rowKey="id_carrera" :loading="loadingList" :error="error"
      v-model:search="search" title="Listado de Planes de Estudio" subtitle="Consulta y gestiona los planes actuales."
      icon="school" :showReload="true" :useDefaultActions="true" :searchKeys="['nombre']"
      :successMessage="tableSuccessMessage" @reload="loadCarreras" @edit="onEdit" @delete="onDelete" />

    <GoogleModal v-model="showFormModal" :icon="isEditing ? 'edit' : 'school'"
      :title="isEditing ? 'Editar Plan' : 'Nuevo Plan'" subtitle="Define el nombre y la duración oficial del plan."
      maxWidth="600px" density="comfortable" :confirmLoading="loadingSave"
      :confirmText="isEditing ? 'Actualizar' : 'Guardar'" cancelText="Cancelar" @confirm="handleFormSubmit"
      @cancel="handleCancelForm">
      <form @submit.prevent="handleFormSubmit" class="carrera-form">
        <template v-if="isEditing">
          <div class="carrera-form-grid">
            <GoogleInput v-model="form.nombre" label="Nombre del Plan *" placeholder="Ej. Ingeniería en Sistemas"
              required />
            <GoogleInput v-model="form.duracion_semestres" label="Duración (semestres) *" type="number" min="1"
              required />
          </div>
        </template>

        <template v-else>
          <div v-for="(item, index) in formsList" :key="index" class="carrera-form-row">
            <div class="carrera-form-grid">
              <GoogleInput v-model="item.nombre" :label="`Nombre del Plan ${index + 1} *`"
                placeholder="Ej. Ingeniería en Sistemas" required />
              <GoogleInput v-model="item.duracion_semestres" label="Duración *" type="number" min="1" required />
            </div>
            <button v-if="formsList.length > 1" type="button" class="icon-button icon-danger remove-btn"
              title="Eliminar" @click="removeForm(index)">
              <span class="material-symbols-outlined">remove_circle</span>
            </button>
          </div>

          <div class="add-more-container">
            <GoogleButton type="button" variant="text" size="sm" @click="addForm"
              style="margin-top: 0.5rem; color: #1a73e8;">
              <span class="material-symbols-outlined">add_circle</span>
              Añadir otra carrera
            </GoogleButton>
          </div>
        </template>
      </form>
    </GoogleModal>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

import GoogleButton from '../../components/ui/button.vue';
import GoogleInput from '../../components/ui/input.vue';
import GoogleModal from '../../components/modal/modal.vue';
import GoogleTable, { type TableColumn } from '../../components/ui/table.vue';

import {
  getCarreras,
  createCarrera,
  updateCarrera,
  deleteCarrera,
  type Carrera,
  type CarreraCreate,
} from '../../services/carreras';

const emit = defineEmits(['update']);

const carreras = ref<Carrera[]>([]);
const loadingList = ref(false);
const loadingSave = ref(false);
const error = ref<string | null>(null);

const isEditing = ref(false);
const editingId = ref<number | null>(null);
const search = ref('');

const tableSuccessMessage = ref<string | null>(null);

const showFormModal = ref(false);

const form = ref<CarreraCreate>({
  nombre: '',
  duracion_semestres: 9,
});

const formsList = ref<CarreraCreate[]>([
  { nombre: '', duracion_semestres: 9 }
]);

function addForm() {
  formsList.value.push({ nombre: '', duracion_semestres: 9 });
}

function removeForm(index: number) {
  formsList.value.splice(index, 1);
}

const carreraColumns: TableColumn[] = [
  { key: 'id_carrera', label: 'ID', width: '80px', align: 'left' },
  { key: 'nombre', label: 'Nombre del Plan' },
  {
    key: 'duracion_semestres',
    label: 'Semestres',
    width: '110px',
    align: 'center',
  },
];

const resetForm = () => {
  form.value = {
    nombre: '',
    duracion_semestres: 9,
  };
  formsList.value = [
    { nombre: '', duracion_semestres: 9 }
  ];
  isEditing.value = false;
  editingId.value = null;
};

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

function openCreateForm() {
  resetForm();
  isEditing.value = false;
  showFormModal.value = true;
}

async function saveCarrera() {
  try {
    error.value = null;
    loadingSave.value = true;

    if (isEditing.value && editingId.value !== null) {
      const payload: CarreraCreate = {
        nombre: form.value.nombre.trim(),
        duracion_semestres: Number(form.value.duracion_semestres) || 1,
      };
      const updated = await updateCarrera(editingId.value, payload);
      carreras.value = carreras.value.map((c) =>
        c.id_carrera === editingId.value ? updated : c,
      );
      tableSuccessMessage.value = 'Carrera actualizada correctamente';
    } else {
      // Guardar múltiples carreras
      const newCarreras = [];
      for (const item of formsList.value) {
        if (!item.nombre.trim()) continue;
        const payload: CarreraCreate = {
          nombre: item.nombre.trim(),
          duracion_semestres: Number(item.duracion_semestres) || 1,
        };
        const created = await createCarrera(payload);
        newCarreras.push(created);
      }
      carreras.value.push(...newCarreras);
      tableSuccessMessage.value = `${newCarreras.length} carrera(s) creada(s) correctamente`;
    }

    emit('update');
    resetForm();
  } catch (e) {
    console.error(e);
    error.value = isEditing.value
      ? 'Error al actualizar carrera'
      : 'Error al crear la(s) carrera(s)';
  } finally {
    loadingSave.value = false;
  }
}

async function handleFormSubmit() {
  await saveCarrera();
  if (!error.value) {
    showFormModal.value = false;
  }
}

function handleCancelForm() {
  resetForm();
  showFormModal.value = false;
}

function onEdit(carrera: Carrera) {
  isEditing.value = true;
  editingId.value = carrera.id_carrera;

  form.value = {
    nombre: carrera.nombre,
    duracion_semestres: carrera.duracion_semestres,
  };

  showFormModal.value = true;
}

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
    emit('update');
  } catch (e) {
    console.error(e);
    error.value = 'Error al eliminar carrera';
  }
}

function animateEntrance() {
  import('animejs').then(({ animate }) => {
    animate('.g-table tbody tr', {
      opacity: [0, 1],
      translateX: [-12, 0],
      delay: (_el: any, i: number) => i * 40,
      duration: 700,
      easing: 'easeOutQuart'
    });

    animate('.chip', {
      scale: [0.8, 1],
      opacity: [0, 1],
      delay: (_el: any, i: number) => 200 + (i * 60),
      duration: 600,
      easing: 'easeOutElastic(1, .8)'
    });
  });
}

onMounted(() => {
  loadCarreras().then(() => {
    setTimeout(animateEntrance, 100);
  });
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

.carrera-form-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed #dadce0;
}

.carrera-form-row:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.carrera-form-row .carrera-form-grid {
  flex: 1;
}

.remove-btn {
  margin-top: 1.5rem;
  /* Alineado al input, saltando el label */
}

.add-more-container {
  display: flex;
  justify-content: flex-start;
  margin-top: 0.5rem;
}
</style>
