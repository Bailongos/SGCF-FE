<template>
  <BaseModal
    v-model="innerVisible"
    title="Carga masiva de alumnos"
    subtitle="Usa la plantilla Excel para registrar varios alumnos en una sola operación."
    :close-on-backdrop="!loading"
  >
    <div class="bulk-body">
      <div class="bulk-upload-row">
        <label class="field">
          <span class="field-label">Archivo Excel (.xlsx / .xls)</span>
          <input
            type="file"
            accept=".xlsx,.xls"
            @change="onFileChange"
            :disabled="parsing || loading"
            class="field-input"
          />
        </label>
        <div v-if="fileName" class="bulk-file-name">
          Archivo seleccionado:
          <strong>{{ fileName }}</strong>
        </div>
      </div>

      <p class="bulk-hint">
        <strong>Formato esperado de columnas:</strong>
        <code>matricula</code>,
        <code>nombre_completo</code>,
        <code>email_institucional</code>,
        <code>telefono_contacto</code>,
        <code>id_carrera</code>,
        <code>semestre_actual</code>,
        <code>activo</code> (opcional).
      </p>

      <div v-if="parsing" class="bulk-status">
        Leyendo archivo...
      </div>

      <div v-if="rows.length" class="bulk-preview">
        <div class="bulk-preview-header">
          <span>
            Registros listos para cargar:
            <strong>{{ rows.length }}</strong>
          </span>
          <span v-if="progress.total">
            Progreso:
            <strong>
              {{ progress.processed }} / {{ progress.total }}
            </strong>
          </span>
        </div>

        <div class="table-wrapper small">
          <table class="table">
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>ID Carrera</th>
                <th>Semestre</th>
                <th>Activo</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in rows.slice(0, 10)"
                :key="row.matricula + '-' + idx"
              >
                <td>{{ row.matricula }}</td>
                <td>{{ row.nombre_completo }}</td>
                <td>{{ row.email_institucional }}</td>
                <td>{{ row.telefono_contacto }}</td>
                <td>{{ row.id_carrera }}</td>
                <td>{{ row.semestre_actual }}</td>
                <td>{{ row.activo ? 'Sí' : 'No' }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="rows.length > 10" class="hint">
            Mostrando solo los primeros 10 registros.
          </p>
        </div>
      </div>

      <p v-if="!parsing && !rows.length" class="empty">
        Aún no hay registros preparados. Usa la plantilla y selecciona un archivo Excel para
        previsualizar los alumnos a crear.
      </p>

      <div v-if="errors.length" class="bulk-errors">
        <h4>Errores durante la carga</h4>
        <ul>
          <li v-for="(err, i) in errors" :key="i">
            {{ err }}
          </li>
        </ul>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="btn btn-text"
        @click="innerVisible = false"
        :disabled="loading"
      >
        Cerrar
      </button>
      <button
        type="button"
        class="btn btn-primary"
        @click="$emit('upload')"
        :disabled="loading || !rows.length"
      >
        <span v-if="loading">
          Cargando {{ progress.processed }} / {{ progress.total }}...
        </span>
        <span v-else>
          Ejecutar carga masiva
        </span>
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import BaseModal from '../BaseModal.vue';
import type { AlumnoCreate } from '../../services/alumnos';

const props = defineProps<{
  modelValue: boolean;
  fileName: string;
  rows: (AlumnoCreate & { activo: boolean })[];
  errors: string[];
  parsing: boolean;
  loading: boolean;
  progress: { processed: number; total: number };
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'file-change', event: Event): void;
  (e: 'upload'): void;
}>();

const innerVisible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
});

function onFileChange(event: Event) {
  emit('file-change', event);
}
</script>

<style scoped>
.bulk-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bulk-upload-row {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
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
  background-color: #ffffff;
}

.field-input:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 1px rgba(26, 115, 232, 0.2);
}

.bulk-file-name {
  font-size: 0.85rem;
  color: #5f6368;
}

.bulk-hint {
  font-size: 0.8rem;
  color: #5f6368;
}

.bulk-hint code {
  font-family: Consolas, monospace;
  background: #f1f3f4;
  padding: 0.05rem 0.25rem;
  border-radius: 4px;
}

.bulk-status {
  font-size: 0.86rem;
  color: #1a73e8;
}

.bulk-preview {
  margin-top: 0.25rem;
}

.bulk-preview-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #5f6368;
}

.table-wrapper.small {
  max-height: 260px;
  overflow: auto;
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

.hint {
  font-size: 0.75rem;
  color: #a0a4a8;
  margin-top: 0.15rem;
}

.empty {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: #5f6368;
}

.bulk-errors {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fce8e6;
  border-radius: 8px;
  border: 1px solid #f8d7da;
}

.bulk-errors h4 {
  margin: 0 0 0.35rem;
  font-size: 0.9rem;
  color: #b00020;
}

.bulk-errors ul {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.8rem;
  color: #b00020;
}

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
</style>
