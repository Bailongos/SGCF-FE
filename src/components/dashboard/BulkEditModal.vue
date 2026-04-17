<!-- src/components/dashboard/BulkEditModal.vue -->
<template>
  <GoogleModal
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    icon="group"
    title="Edición múltiple de alumnos"
    subtitle="Actualiza en lote datos del alumno, ciclo actual y adeudo total."
    maxWidth="900px"
    density="comfortable"
    :confirmLoading="loading"
    confirmText="Aplicar cambios"
    cancelText="Cancelar"
    @confirm="$emit('confirm')"
    @cancel="$emit('update:modelValue', false)"
  >
    <div class="bulk-edit-container">
      <div class="bulk-header">
        <p class="bulk-summary">
          Estás editando <strong>{{ rows.length }}</strong> alumnos seleccionados.
        </p>

        <div class="mode-switch">
          <label class="switch-label">
            <input type="checkbox" v-model="internalAdvancedMode" @change="$emit('update:advancedMode', internalAdvancedMode)" />
            <span class="switch-text">Modo avanzado (edición individual por fila)</span>
          </label>
        </div>
      </div>

      <div v-if="internalAdvancedMode" class="advanced-editor custom-scrollbar">
        <table class="bulk-table">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Nombre completo</th>
              <th>Semestre</th>
              <th>Plan</th>
              <th>Ciclo actual</th>
              <th>Adeudo total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in rows" :key="`${row.original_matricula}-${index}`">
              <td>
                <GoogleInput v-model.trim="row.matricula" size="sm" transparent />
              </td>
              <td>
                <GoogleInput v-model.trim="row.nombre_completo" size="sm" transparent />
              </td>
              <td>
                <GoogleInput v-model.number="row.semestre_actual" size="sm" type="number" min="1" transparent />
              </td>
              <td>
                <GoogleSelect v-model="row.id_carrera" :options="carreraOptions" size="sm" transparent />
              </td>
              <td>
                <GoogleSelect v-model="row.id_ciclo_actual" :options="cicloOptions" size="sm" transparent />
              </td>
              <td>
                <GoogleInput v-model.number="row.adeudo_total" size="sm" type="number" min="0" step="0.01" transparent />
              </td>
              <td>
                <GoogleSelect v-model="row.activo" :options="activoOptions" size="sm" transparent />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="simple-editor">
        <div class="edit-group card">
          <div class="group-header">
            <input type="checkbox" v-model="form.applyCarrera" />
            <span class="group-title">Actualizar plan de estudio</span>
          </div>
          <GoogleSelect
            v-model="form.id_carrera"
            :options="carreraOptions"
            placeholder="Selecciona nuevo plan para todos"
            :disabled="!form.applyCarrera"
            size="md"
          />
        </div>

        <div class="edit-group card">
          <div class="group-header">
            <input type="checkbox" v-model="form.applySemestre" />
            <span class="group-title">Actualizar semestre actual</span>
          </div>
          <GoogleInput
            v-model.number="form.semestre_actual"
            type="number"
            min="1"
            placeholder="Nuevo semestre para todos"
            :disabled="!form.applySemestre"
            size="md"
          />
        </div>

        <div class="edit-group card">
          <div class="group-header">
            <input type="checkbox" v-model="form.applyActivo" />
            <span class="group-title">Actualizar estado de actividad</span>
          </div>
          <GoogleSelect
            v-model="form.activo"
            :options="activoOptions"
            placeholder="Selecciona estado para todos"
            :disabled="!form.applyActivo"
            size="md"
          />
        </div>
        
        <p class="bulk-tip">
          <span class="material-symbols-outlined">info</span>
          Los cambios se aplicarán de forma masiva a todos los registros seleccionados. Los campos no marcados conservarán su valor original.
        </p>
      </div>
    </div>
  </GoogleModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import GoogleModal from '../modal/modal.vue';
import GoogleInput from '../ui/input.vue';
import GoogleSelect, { type SelectOption } from '../ui/select.vue';

interface BulkRow {
  original_matricula: string;
  matricula: string;
  nombre_completo: string;
  id_carrera: number | null;
  semestre_actual: number;
  activo: number;
  id_ciclo_actual: number | null;
  adeudo_total: number;
}

interface BulkForm {
  applyCarrera: boolean;
  id_carrera: number | null;
  applySemestre: boolean;
  semestre_actual: number;
  applyActivo: boolean;
  activo: number;
}

const props = defineProps<{
  modelValue: boolean;
  rows: BulkRow[];
  form: BulkForm;
  advancedMode: boolean;
  loading: boolean;
  carreraOptions: SelectOption[];
  cicloOptions: SelectOption[];
  activoOptions: SelectOption[];
}>();

const emit = defineEmits(['update:modelValue', 'update:advancedMode', 'confirm']);

const internalAdvancedMode = ref(props.advancedMode);

watch(() => props.advancedMode, (val) => {
  internalAdvancedMode.value = val;
});
</script>

<style scoped>
.bulk-edit-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.5rem 0;
}

.bulk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.bulk-summary {
  margin: 0;
  font-size: 1rem;
  color: var(--md-sys-color-on-surface);
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--md-sys-color-primary);
  font-weight: 600;
}

.switch-label input {
  width: 18px;
  height: 18px;
}

/* Modo Avanzado: Tabla de edición masiva */
.advanced-editor {
  max-height: 50vh;
  overflow: auto;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 12px;
}

.bulk-table {
  width: 100%;
  border-collapse: collapse;
}

.bulk-table th {
  position: sticky;
  top: 0;
  background: var(--md-sys-color-surface-container-high);
  z-index: 10;
  padding: 0.75rem;
  text-align: left;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--md-sys-color-on-surface-variant);
  border-bottom: 2px solid var(--md-sys-color-outline-variant);
}

.bulk-table td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface);
}

/* Modo Simple: Grupos de edición masiva */
.simple-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 500px;
  margin: 0 auto;
  width: 100%;
}

.edit-group {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.2s, background-color 0.2s;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.group-header input {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.group-title {
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.card {
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 16px;
}

.bulk-tip {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  border-radius: 12px;
  font-size: 0.85rem;
  line-height: 1.5;
}

.bulk-tip .material-symbols-outlined {
  font-size: 20px;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--md-sys-color-surface-container-low);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--md-sys-color-outline-variant);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--md-sys-color-outline);
}
</style>
