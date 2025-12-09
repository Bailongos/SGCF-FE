<!-- src/views/ConceptosView.vue -->
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
        <h2 class="page-title">Conceptos de pago</h2>
        <p class="page-subtitle">
          Catálogo de conceptos, clave, monto base y generación automática de cuentas.
        </p>
      </div>

      <div class="page-header-meta">
        <span class="chip chip-soft">
          Conceptos: <strong>{{ conceptos.length }}</strong>
        </span>
        <span class="chip chip-soft">
          Generan cuenta:
          <strong>{{ totalGeneranCuenta }}</strong>
        </span>

        <GoogleButton
          size="sm"
          color="#1a73e8"
          @click="openCreateForm"
        >
          <span class="material-symbols-outlined">add</span>
          Nuevo concepto
        </GoogleButton>
      </div>
    </header>

    <!-- Tabla genérica googlesca -->
    <GoogleTable
      :rows="conceptos"
      :columns="conceptosColumns"
      rowKey="clave"
      :loading="loadingList"
      :error="error"
      v-model:search="search"
      title="Listado de conceptos"
      subtitle="Consulta, edita o elimina conceptos de pago."
      icon="sell"
      :showReload="true"
      :useDefaultActions="true"
      :searchKeys="['clave', 'descripcion']"
      :successMessage="tableSuccessMessage"
      emptyMessage="No hay conceptos que coincidan con el filtro."
      @reload="loadConceptos"
      @edit="onEdit"
      @delete="onDelete"
    />

    <!-- Modal Crear / Editar concepto -->
    <GoogleModal
      v-model="showFormModal"
      :icon="isEditing ? 'edit' : 'note_add'"
      :title="isEditing ? 'Editar concepto' : 'Nuevo concepto'"
      subtitle="Define la clave, descripción, monto base y si el concepto genera cuenta automáticamente."
      maxWidth="640px"
      density="comfortable"
      :confirmLoading="loadingSave"
      :confirmText="isEditing ? 'Actualizar' : 'Guardar'"
      cancelText="Cancelar"
      @confirm="handleFormSubmit"
      @cancel="handleCancelForm"
    >
      <form @submit.prevent="handleFormSubmit" class="concepto-form">
        <div class="concepto-form-grid">
          <GoogleInput
            v-model.trim="form.clave"
            label="Clave *"
            placeholder="Ej. UADEC, ESCUELA"
            :disabled="isEditing"
            required
          />

          <GoogleInput
            v-model.trim="form.descripcion"
            label="Descripción *"
            placeholder="Ej. Colegiatura UADEC"
            required
          />

          <GoogleInput
            v-model="form.monto_default"
            label="Monto base *"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            required
          />

          <label class="field-checkbox">
            <input
              v-model="form.genera_cuenta_default"
              type="checkbox"
            />
            <span>Generar cuenta automáticamente por este concepto</span>
          </label>
        </div>

        <p class="concepto-hint">
          La clave se usa como identificador único del concepto. El monto base se puede
          ajustar después en las cuentas específicas.
        </p>
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
  getConceptos,
  createConcepto,
  updateConcepto,
  deleteConcepto,
  type Concepto,
  type ConceptoPayload,
} from '../services/conceptos';

// ---- STATE ----
const conceptos = ref<Concepto[]>([]);
const loadingList = ref(false);
const loadingSave = ref(false);
const error = ref<string | null>(null);

const search = ref('');
const isEditing = ref(false);

// para mostrar mensajes de éxito dentro de la tabla (toast interno)
const tableSuccessMessage = ref<string | null>(null);

// Modal formulario
const showFormModal = ref(false);

type ConceptoForm = ConceptoPayload;

const form = ref<ConceptoForm>({
  clave: '',
  descripcion: '',
  monto_default: 0,
  genera_cuenta_default: false,
});

// ---- HELPERS ----
function resetForm() {
  form.value = {
    clave: '',
    descripcion: '',
    monto_default: 0,
    genera_cuenta_default: false,
  };
  isEditing.value = false;
}

function formatMoney(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return n.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  });
}

const filteredConceptos = computed(() => {
  if (!search.value.trim()) return conceptos.value;
  const term = search.value.toLowerCase();
  return conceptos.value.filter((c) =>
    c.descripcion.toLowerCase().includes(term) ||
    c.clave.toLowerCase().includes(term),
  );
});

const totalGeneranCuenta = computed(
  () => conceptos.value.filter((c) => c.genera_cuenta_default).length,
);

// Columnas para GoogleTable
const conceptosColumns: TableColumn[] = [
  { key: 'clave', label: 'Clave', width: '120px' },
  { key: 'descripcion', label: 'Descripción' },
  {
    key: 'monto_default',
    label: 'Monto base',
    align: 'right',
    formatter: (row: Concepto) => formatMoney(row.monto_default),
  },
  {
    key: 'genera_cuenta_default',
    label: 'Genera cuenta',
    width: '130px',
    align: 'center',
    formatter: (row: Concepto) => (row.genera_cuenta_default ? 'Sí' : 'No'),
  },
];

// ---- API CALLS ----
async function loadConceptos() {
  try {
    error.value = null;
    loadingList.value = true;
    const resp = await getConceptos();
    conceptos.value = resp;
  } catch (e) {
    console.error('[ConceptosView] Error al cargar conceptos', e);
    error.value = 'Error al cargar conceptos';
  } finally {
    loadingList.value = false;
  }
}

// Abre modal para nuevo concepto
function openCreateForm() {
  resetForm();
  isEditing.value = false;
  showFormModal.value = true;
}

// Lógica central para guardar/actualizar
async function saveConcepto() {
  try {
    error.value = null;
    tableSuccessMessage.value = null;
    loadingSave.value = true;

    const payload: ConceptoPayload = {
      clave: form.value.clave.trim(),
      descripcion: form.value.descripcion.trim(),
      monto_default: Number(form.value.monto_default) || 0,
      genera_cuenta_default: form.value.genera_cuenta_default,
    };

    if (!payload.clave || !payload.descripcion) {
      error.value = 'La clave y la descripción son obligatorias.';
      return;
    }

    if (isEditing.value) {
      const updated = await updateConcepto(payload.clave, payload);
      conceptos.value = conceptos.value.map((c) =>
        c.clave === updated.clave ? updated : c,
      );
      tableSuccessMessage.value = 'Concepto actualizado correctamente';
    } else {
      const created = await createConcepto(payload);
      conceptos.value.push(created);
      tableSuccessMessage.value = 'Concepto creado correctamente';
    }

    resetForm();
  } catch (e) {
    console.error('[ConceptosView] Error al guardar concepto', e);
    error.value = isEditing.value
      ? 'Error al actualizar el concepto'
      : 'Error al crear el concepto';
  } finally {
    loadingSave.value = false;
  }
}

// submit desde el modal (botón footer o Enter en el form)
async function handleFormSubmit() {
  await saveConcepto();
  if (!error.value) {
    showFormModal.value = false;
  }
}

// cancelar desde el modal
function handleCancelForm() {
  resetForm();
  showFormModal.value = false;
}

// Editar desde la tabla
function onEdit(concepto: Concepto) {
  isEditing.value = true;
  form.value = {
    clave: concepto.clave,
    descripcion: concepto.descripcion,
    monto_default: concepto.monto_default,
    genera_cuenta_default: concepto.genera_cuenta_default,
  };
  showFormModal.value = true;
}

// Eliminar desde la tabla
async function onDelete(row: Concepto) {
  const clave = row.clave;
  if (!confirm(`¿Eliminar concepto ${clave}?`)) return;
  try {
    await deleteConcepto(clave);
    conceptos.value = conceptos.value.filter(
      (c) => c.clave !== clave,
    );
    if (form.value.clave === clave) {
      resetForm();
    }
    tableSuccessMessage.value = 'Concepto eliminado correctamente';
  } catch (e) {
    console.error('[ConceptosView] Error al eliminar concepto', e);
    error.value = 'Error al eliminar el concepto';
  }
}

onMounted(async () => {
  await loadConceptos();
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

.concepto-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.concepto-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem 1rem;
}

@media (max-width: 768px) {
  .concepto-form-grid {
    grid-template-columns: 1fr;
  }
}

.field-checkbox {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.25rem;
  font-size: 0.9rem;
  color: #5f6368;
}

.concepto-hint {
  font-size: 0.8rem;
  color: #80868b;
  margin-top: 0.15rem;
}
</style>
