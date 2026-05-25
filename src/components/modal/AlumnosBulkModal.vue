<template>
  <GoogleModal v-model="innerVisible" title="Carga masiva de alumnos" icon="upload_file"
    subtitle="Usa la plantilla Excel para registrar varios alumnos en una sola operación." maxWidth="800px"
    :closeOnOverlay="!loading" :showFooter="false">
    <div class="bulk-body">
      <div class="bulk-upload-row">
        <label class="field">
          <span class="field-label">Archivo Excel (.xlsx / .xls)</span>
          <input type="file" accept=".xlsx,.xls" @change="onFileChange" :disabled="parsing || loading"
            class="field-input" />
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
        <code>activo</code> (opcional),
        <code>conceptos</code> (opcional, varios separados por <code>|</code>),
        <code>id_ciclo_adeudo</code> (opcional),
        <code>pagado_adeudo</code> (opcional).
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
                <th>ID Plan</th>
                <th>Semestre</th>
                <th>Activo</th>
                <th>Conceptos (adeudo)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in rows.slice(0, 10)" :key="row.matricula + '-' + idx">
                <td>{{ row.matricula }}</td>
                <td>{{ row.nombre_completo }}</td>
                <td>{{ row.email_institucional }}</td>
                <td>{{ row.telefono_contacto }}</td>
                <td>{{ row.id_carrera }}</td>
                <td>{{ row.semestre_actual }}</td>
                <td>{{ row.activo ? 'Sí' : 'No' }}</td>
                <td>{{ row.conceptos_display || '-' }}</td>
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
      <GoogleButton type="button" variant="text" @click="innerVisible = false" :disabled="loading">
        Cerrar
      </GoogleButton>
      <GoogleButton type="button" variant="filled" @click="$emit('upload')" :disabled="loading || !rows.length" :loading="loading">
        <span v-if="loading">
          Cargando {{ progress.processed }} / {{ progress.total }}...
        </span>
        <span v-else>
          Ejecutar carga masiva
        </span>
      </GoogleButton>
    </template>
  </GoogleModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import GoogleModal from './modal.vue';
import GoogleButton from '../ui/button.vue';
import type { AlumnoCreate } from '../../services/alumnos';

type BulkPreviewRow = AlumnoCreate & {
  activo: boolean;
  conceptos_display?: string;
};

const props = defineProps<{
  modelValue: boolean;
  fileName: string;
  rows: BulkPreviewRow[];
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
  color: var(--md-sys-color-on-surface-variant);
}

.field-input {
  padding: 0.45rem 0.6rem;
  border-radius: 4px;
  border: 1px solid var(--md-sys-color-outline);
  font-size: 0.9rem;
  outline: none;
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.field-input:focus {
  border-color: var(--md-sys-color-primary);
  box-shadow: 0 0 0 1px var(--md-sys-color-primary);
}

.bulk-file-name {
  font-size: 0.85rem;
  color: var(--md-sys-color-on-surface-variant);
}

.bulk-hint {
  font-size: 0.8rem;
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.6;
}

.bulk-hint code {
  font-family: Consolas, monospace;
  background: var(--md-sys-color-surface-container);
  padding: 0.05rem 0.25rem;
  border-radius: 4px;
  color: var(--md-sys-color-on-surface);
}

.bulk-status {
  font-size: 0.86rem;
  color: var(--md-sys-color-primary);
}

.bulk-preview {
  margin-top: 0.25rem;
}

.bulk-preview-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--md-sys-color-on-surface-variant);
}

.table-wrapper.small {
  max-height: 260px;
  overflow: auto;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: 4px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: var(--md-sys-color-surface);
}

.table th,
.table td {
  padding: 0.55rem 0.75rem;
  font-size: 0.85rem;
}

.table thead {
  background: var(--md-sys-color-surface-container);
}

.table th {
  text-align: left;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  border-bottom: 2px solid var(--md-sys-color-outline);
  white-space: nowrap;
}

.table td {
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface);
}

.hint {
  font-size: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
  margin-top: 0.15rem;
}

.empty {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: var(--md-sys-color-on-surface-variant);
}

.bulk-errors {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--md-sys-color-error-container);
  border-radius: 4px;
  border: 1px solid var(--md-sys-color-error);
}

.bulk-errors h4 {
  margin: 0 0 0.35rem;
  font-size: 0.9rem;
  color: var(--md-sys-color-on-error-container);
}

.bulk-errors ul {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.8rem;
  color: var(--md-sys-color-on-error-container);
}
</style>
