<!-- src/components/ui/table.vue -->
<template>
  <SectionCard class="g-table-card" :icon="icon" :title="titleToShow" :subtitle="subtitleToShow" density="comfortable">
    <!-- Header derecho: search + recargar -->
    <template #header-extra>
      <div class="g-table-header-right">
        <GoogleInput v-if="showSearch" v-model="localSearch" class="g-table-search-input" placeholder="Buscar..."
          size="sm" label="" />

        <GoogleButton v-if="showReload" variant="text" size="sm" :loading="loading" :disabled="loading"
          @click="$emit('reload')">
          Recargar
        </GoogleButton>
      </div>
    </template>

    <!-- Mensaje de éxito tipo toast interno -->
    <transition name="g-toast-fade">
      <div v-if="successMessage" class="g-table-toast">
        <span class="material-symbols-outlined g-table-toast-icon">
          check_circle
        </span>
        <span>{{ successMessage }}</span>
      </div>
    </transition>

    <!-- Error -->
    <p v-if="error" class="g-table-error">{{ error }}</p>

    <!-- Tabla -->
    <div v-if="filteredRows.length" class="g-table-wrapper">
      <table class="g-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="String(col.key)" :style="col.width ? { width: col.width } : undefined"
              class="g-table-header-cell" :class="col.align ? `g-table-header-cell--${col.align}` : ''">
              {{ col.label }}
            </th>

            <th v-if="useDefaultActions" class="g-table-header-cell g-table-header-cell--right g-table-header-actions">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredRows" :key="getRowKey(row)">
            <td v-for="col in columns" :key="String(col.key)" class="g-table-cell"
              :class="col.align ? `g-table-cell--${col.align}` : ''">
              <span v-if="col.badge" class="g-table-badge">{{ formatCell(row, col) }}</span>
              <template v-else>{{ formatCell(row, col) }}</template>
            </td>

            <td v-if="useDefaultActions" class="g-table-cell g-table-cell--right g-table-cell-actions">
              <button type="button" class="g-icon-button" title="Editar" @click="$emit('edit', row)">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button type="button" class="g-icon-button g-icon-button--danger" title="Eliminar"
                @click="$emit('delete', row)">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Vacío -->
    <p v-else class="g-table-empty">
      {{ emptyMessageToShow }}
    </p>
  </SectionCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import SectionCard from '../layout/sideCard.vue';
import GoogleInput from '../ui/input.vue';
import GoogleButton from '../ui/button.vue';

export type Align = 'left' | 'center' | 'right';

export interface TableColumn<T = any> {
  key: string;                    // nombre de la propiedad en la fila
  label: string;                  // encabezado
  width?: string;                 // ej. '90px'
  align?: Align;                  // 'left' | 'center' | 'right'
  badge?: boolean;                // renderizar valor como badge
  formatter?: (row: T) => any;    // función para formatear el valor
}

const props = withDefaults(defineProps<{
  rows: any[];
  columns: TableColumn[];
  rowKey: string;

  loading?: boolean;
  error?: string | null;

  // búsqueda
  search?: string;
  searchKeys?: string[];

  // layout
  title?: string;
  subtitle?: string;
  icon?: string;

  showReload?: boolean;
  showSearch?: boolean;
  useDefaultActions?: boolean;

  successMessage?: string | null;
  emptyMessage?: string;
}>(), {
  rows: () => [],
  columns: () => [],
  loading: false,
  error: null,
  search: '',
  searchKeys: () => [],
  title: '',
  subtitle: '',
  icon: 'table',
  showReload: true,
  showSearch: true,
  useDefaultActions: true,
  successMessage: null,
  emptyMessage: 'No hay registros para mostrar.',
});

const emit = defineEmits<{
  (e: 'reload'): void;
  (e: 'edit', row: any): void;
  (e: 'delete', row: any): void;
  (e: 'update:search', value: string): void;
}>();

const titleToShow = computed(() => props.title || 'Listado');
const subtitleToShow = computed(
  () => props.subtitle || 'Consulta y gestiona los registros.',
);
const emptyMessageToShow = computed(
  () => props.emptyMessage || 'No hay registros para mostrar.',
);

// v-model:search
const localSearch = computed({
  get: () => props.search ?? '',
  set: (val: string) => emit('update:search', val),
});

// key de la fila
function getRowKey(row: any): string | number {
  const k = props.rowKey;
  return (row && row[k as keyof typeof row]) as any;
}

// Formatear celda
function formatCell(row: any, col: TableColumn): any {
  if (col.formatter) {
    return col.formatter(row);
  }
  const value = (row as any)[col.key];
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return value;
}

// Filtrado por search
const filteredRows = computed(() => {
  const term = localSearch.value.toLowerCase().trim();
  if (!term) return props.rows;

  const keys = (props.searchKeys?.length ? props.searchKeys : null) ?? null;

  return props.rows.filter((row) => {
    if (!keys) {
      // buscar en todas las props string
      return Object.values(row).some((v) =>
        String(v ?? '')
          .toLowerCase()
          .includes(term),
      );
    }

    return keys.some((k) =>
      String((row as any)[k] ?? '')
        .toLowerCase()
        .includes(term),
    );
  });
});
</script>

<style scoped>
.g-table-card {
  width: 100%;
}

/* Header */

.g-table-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.g-table-search-input {
  min-width: 220px;
}

/* Tabla */

.g-table-wrapper {
  margin-top: 0.75rem;
  border-radius: 12px;
  border: 1px solid var(--md-sys-color-outline-variant);
  overflow-x: auto;
  overflow-y: hidden;
}

.g-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--md-sys-color-surface);
}

.g-table-header-cell,
.g-table-cell {
  padding: 0.55rem 0.75rem;
  font-size: 0.85rem;
}

.g-table thead {
  background: var(--md-sys-color-surface-container);
}

.g-table-header-cell {
  text-align: left;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.g-table-cell {
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface);
}

.g-table-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.12rem 0.55rem;
  border: 1px solid var(--md-sys-color-primary-container);
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  font-size: 0.75rem;
  font-weight: 500;
}

/* alineación */

.g-table-header-cell--center,
.g-table-cell--center {
  text-align: center;
}

.g-table-header-cell--right,
.g-table-cell--right {
  text-align: right;
}

/* col de acciones */

.g-table-header-actions {
  width: 90px;
}

.g-table-cell-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
}

/* Icon buttons */

.g-icon-button {
  width: 32px;
  height: 32px;
  border: 1px solid var(--md-sys-color-primary-container);
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-primary);
  cursor: pointer;
  border-radius: 8px;
  padding: 0;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.g-icon-button:hover {
  background: color-mix(in srgb, var(--md-sys-color-primary), transparent 85%);
  border-color: var(--md-sys-color-primary);
}

.g-icon-button--danger {
  border-color: var(--md-sys-color-error);
  background: color-mix(in srgb, var(--md-sys-color-error), transparent 85%);
  color: var(--md-sys-color-error);
}

.g-icon-button--danger:hover {
  background: color-mix(in srgb, var(--md-sys-color-error), transparent 75%);
  border-color: var(--md-sys-color-error);
}

/* Estados */

.g-table-error {
  color: var(--md-sys-color-error);
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.g-table-empty {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: var(--md-sys-color-on-surface-variant);
}

/* Toast interno */

.g-table-toast {
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  background: var(--md-sys-color-success-container);
  color: var(--md-sys-color-success);
}

.g-table-toast-icon {
  font-size: 18px;
}

/* animación toast */

.g-toast-fade-enter-active,
.g-toast-fade-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.g-toast-fade-enter-from,
.g-toast-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
