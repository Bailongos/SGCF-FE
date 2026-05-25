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

        <GoogleButton size="sm" @click="openCreateForm">
          <span class="material-symbols-outlined">add</span>
          Nueva carrera
        </GoogleButton>
      </div>
    </header>

    <GoogleTable :rows="carreras" :columns="carreraColumns" rowKey="id_carrera" :loading="loadingList"
      v-model:search="search" title="Listado de Planes de Estudio" subtitle="Consulta y gestiona los planes actuales."
      icon="school" :showReload="true" :useDefaultActions="true" :searchKeys="['clave', 'nombre']"
      @reload="loadCarreras" @edit="onEdit" @delete="onDelete" />

    <GoogleModal v-model="showFormModal" :icon="isEditing ? 'edit' : 'school'"
      :title="isEditing ? 'Editar Plan' : 'Nuevo Plan'" subtitle="Define clave, nombre y duración oficial del plan."
      maxWidth="600px" density="comfortable" :confirmLoading="loadingSave"
      :confirmText="isEditing ? 'Actualizar' : 'Guardar'" cancelText="Cancelar" @confirm="handleFormSubmit"
      @cancel="handleCancelForm">
      <form @submit.prevent="handleFormSubmit" class="carrera-form">
        <template v-if="isEditing">
          <div class="carrera-form-grid">
            <GoogleInput v-model.trim="form.clave" label="Clave *" placeholder="Ej. IS-MTY" required />
            <GoogleInput v-model="form.nombre" label="Nombre del Plan *" placeholder="Ej. Ingeniería en Sistemas"
              required />
            <GoogleInput v-model="form.duracion_semestres" label="Duración (semestres) *" type="number" min="1"
              required />
          </div>
        </template>

        <template v-else>
          <div v-for="(item, index) in formsList" :key="index" class="carrera-form-row">
            <div class="carrera-form-grid">
              <GoogleInput v-model.trim="item.clave" :label="`Clave ${index + 1} *`" placeholder="Ej. IS-MTY" required />
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
              style="margin-top: 0.5rem;">
              <span class="material-symbols-outlined">add_circle</span>
              Añadir otra carrera
            </GoogleButton>
          </div>
        </template>

        <p class="carrera-hint">
          La clave debe ser única y usar solo letras, números y guion medio.
        </p>
      </form>
    </GoogleModal>

    <ConfirmModal v-model="showDeleteConfirm" title="Eliminar plan de estudio"
      :message="`¿Eliminar carrera con ID ${deleteTarget?.id_carrera}?`" variant="danger" confirmText="Eliminar"
      @confirm="onDeleteConfirm" />
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from '../../composables/useToast';

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
import { isValidCarreraClave, normalizeCarreraClave } from '../../utils/carreras';
import ConfirmModal from '../../components/modal/ConfirmModal.vue';

const emit = defineEmits(['update']);
const toast = useToast();

const carreras = ref<Carrera[]>([]);
const loadingList = ref(false);
const loadingSave = ref(false);

const isEditing = ref(false);
const showDeleteConfirm = ref(false);
const deleteTarget = ref<Carrera | null>(null);
const editingId = ref<number | null>(null);
const search = ref('');

const showFormModal = ref(false);

const form = ref<CarreraCreate>({
  clave: '',
  nombre: '',
  duracion_semestres: 9,
});

const formsList = ref<CarreraCreate[]>([
  { clave: '', nombre: '', duracion_semestres: 9 }
]);

function addForm() {
  formsList.value.push({ clave: '', nombre: '', duracion_semestres: 9 });
}

function removeForm(index: number) {
  formsList.value.splice(index, 1);
}

const carreraColumns: TableColumn[] = [
  { key: 'id_carrera', label: 'ID', width: '80px', align: 'left' },
  { key: 'clave', label: 'Clave', width: '120px' },
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
    clave: '',
    nombre: '',
    duracion_semestres: 9,
  };
  formsList.value = [
    { clave: '', nombre: '', duracion_semestres: 9 }
  ];
  isEditing.value = false;
  editingId.value = null;
};

function buildPayload(source: Partial<CarreraCreate>, rowLabel = 'La carrera'): CarreraCreate | null {
  const clave = normalizeCarreraClave(String(source.clave ?? ''));
  const nombre = String(source.nombre ?? '').trim();
  const duracion_semestres = Number(source.duracion_semestres) || 1;

  if (!clave || !nombre) {
    toast.error(`${rowLabel} requiere clave y nombre.`);
    return null;
  }

  if (!isValidCarreraClave(clave)) {
    toast.error(`${rowLabel} tiene una clave inválida. Usa solo letras, números y guion medio.`);
    return null;
  }

  return {
    clave,
    nombre,
    duracion_semestres,
  };
}

async function loadCarreras() {
  try {
    loadingList.value = true;
    carreras.value = await getCarreras();
  } catch (e) {
    console.error(e);
    toast.error('Error al cargar carreras');
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
    loadingSave.value = true;

    if (isEditing.value && editingId.value !== null) {
      const payload = buildPayload(form.value, 'La carrera');
      if (!payload) return false;

      const hasDuplicateClave = carreras.value.some(
        (c) => c.id_carrera !== editingId.value && normalizeCarreraClave(c.clave) === payload.clave,
      );

      if (hasDuplicateClave) {
        toast.error(`La clave ${payload.clave} ya existe en otra carrera.`);
        return false;
      }

      const updated = await updateCarrera(editingId.value, payload);
      carreras.value = carreras.value.map((c) =>
        c.id_carrera === editingId.value ? updated : c,
      );
      toast.success('Carrera actualizada correctamente');
    } else {
      const filledRows = formsList.value.filter(
        (item) => item.clave.trim() || item.nombre.trim(),
      );

      if (!filledRows.length) {
        toast.error('Debes capturar al menos una carrera con clave y nombre.');
        return false;
      }

      const payloads: CarreraCreate[] = [];
      const seenClaves = new Set<string>();
      const existingClaves = new Set(
        carreras.value.map((c) => normalizeCarreraClave(c.clave)).filter(Boolean),
      );

      for (let index = 0; index < filledRows.length; index += 1) {
        const item = filledRows[index];
        if (!item) continue;

        const payload = buildPayload(item, `La carrera ${index + 1}`);
        if (!payload) return false;

        if (seenClaves.has(payload.clave)) {
          toast.error(`La clave ${payload.clave} está repetida en el formulario.`);
          return false;
        }

        if (existingClaves.has(payload.clave)) {
          toast.error(`La clave ${payload.clave} ya existe en el catálogo.`);
          return false;
        }

        seenClaves.add(payload.clave);
        payloads.push(payload);
      }

      const newCarreras: Carrera[] = [];
      for (const payload of payloads) {
        const created = await createCarrera(payload);
        newCarreras.push(created);
      }

      carreras.value.push(...newCarreras);
      toast.success(`${newCarreras.length} carrera(s) creada(s) correctamente`);
    }

    emit('update');
    resetForm();
    return true;
  } catch (e) {
    console.error(e);
    toast.error(isEditing.value
      ? 'Error al actualizar carrera'
      : 'Error al crear la(s) carrera(s)');
    return false;
  } finally {
    loadingSave.value = false;
  }
}

async function handleFormSubmit() {
  const ok = await saveCarrera();
  if (ok) {
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
    clave: carrera.clave,
    nombre: carrera.nombre,
    duracion_semestres: carrera.duracion_semestres,
  };

  showFormModal.value = true;
}

function onDelete(row: Carrera) {
  deleteTarget.value = row;
  showDeleteConfirm.value = true;
}

async function onDeleteConfirm() {
  const row = deleteTarget.value;
  if (!row) return;
  const id = row.id_carrera;
  try {
    await deleteCarrera(id);
    carreras.value = carreras.value.filter((c) => c.id_carrera !== id);
    if (editingId.value === id) {
      resetForm();
    }
    toast.success('Carrera eliminada correctamente');
    emit('update');
  } catch (e) {
    console.error(e);
    toast.error('Error al eliminar carrera');
  } finally {
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
  }
}

function animateEntrance() {
  const tableRows = document.querySelectorAll('.g-table tbody tr');
  const chips = document.querySelectorAll('.chip');

  if (tableRows.length === 0 && chips.length === 0) return;

  import('animejs').then(({ animate, stagger }) => {
    if (tableRows.length > 0) {
      animate('.g-table tbody tr', {
        opacity: [0, 1],
        translateX: [-12, 0],
        delay: stagger(40),
        duration: 700,
        easing: 'easeOutQuart'
      });
    }

    if (chips.length > 0) {
      animate('.chip', {
        scale: [0.8, 1],
        opacity: [0, 1],
        delay: stagger(60, { start: 200 }),
        duration: 600,
        easing: 'easeOutElastic(1, .8)'
      });
    }
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
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface-variant);
}

.chip-primary {
  background: var(--md-sys-color-primary-container);
  border-color: var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-primary-container);
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
  border-bottom: 1px dashed var(--md-sys-color-outline-variant);
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

.carrera-hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--md-sys-color-on-surface-variant);
}
</style>
