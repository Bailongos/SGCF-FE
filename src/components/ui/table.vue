<template>
  <SectionCard class="g-table-card" :icon="icon" :title="titleToShow" :subtitle="subtitleToShow" density="comfortable">
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
  key: string;
  label: string;
  width?: string;
  align?: Align;
  badge?: boolean;
  formatter?: (row: T) => any;
}

const props = withDefaults(defineProps<{
  rows: any[];
  columns: TableColumn[];
  rowKey: string;

  loading?: boolean;

  search?: string;
  searchKeys?: string[];

  title?: string;
  subtitle?: string;
  icon?: string;

  showReload?: boolean;
  showSearch?: boolean;
  useDefaultActions?: boolean;

  emptyMessage?: string;
}>(), {
  rows: () => [],
  columns: () => [],
  loading: false,
  search: '',
  searchKeys: () => [],
  title: '',
  subtitle: '',
  icon: 'table',
  showReload: true,
  showSearch: true,
  useDefaultActions: true,
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

const localSearch = computed({
  get: () => props.search ?? '',
  set: (val: string) => emit('update:search', val),
});

function getRowKey(row: any): string | number {
  const k = props.rowKey;
  return (row && row[k as keyof typeof row]) as any;
}

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

const filteredRows = computed(() => {
  const term = localSearch.value.toLowerCase().trim();
  if (!term) return props.rows;

  const keys = (props.searchKeys?.length ? props.searchKeys : null) ?? null;

  return props.rows.filter((row) => {
    if (!keys) {
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

.g-table-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.g-table-search-input {
  min-width: 220px;
}

.g-table-wrapper {
  margin-top: 0.75rem;
  border-radius: 4px;
  border: 1px solid var(--md-sys-color-outline);
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
  font-size: 0.82rem;
}

.g-table thead {
  background: var(--md-sys-color-surface-container);
}

.g-table-header-cell {
  text-align: left;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  border-bottom: 2px solid var(--md-sys-color-outline);
  font-size: 0.78rem;
}

.g-table-cell {
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface);
  transition: background 0.12s ease;
}

.g-table tbody tr {
  transition: background 0.12s ease;
}

.g-table tbody tr:hover {
  background: var(--md-sys-color-surface-variant);
}

.g-table tbody tr:last-child td {
  border-bottom: none;
}

.g-table-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  padding: 0.1rem 0.5rem;
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-primary);
  font-size: 0.7rem;
  font-weight: 600;
}

.g-table-header-cell--center,
.g-table-cell--center {
  text-align: center;
}

.g-table-header-cell--right,
.g-table-cell--right {
  text-align: right;
}

.g-table-header-actions {
  width: 80px;
}

.g-table-cell-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.15rem;
}

.g-icon-button {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  border-radius: 4px;
  padding: 0;
  font-size: 1.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s ease;
}

.g-icon-button:hover {
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-primary);
}

.g-icon-button--danger:hover {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-error);
}

.g-table-empty {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: var(--md-sys-color-on-surface-variant);
  text-align: center;
  padding: 2rem 0;
}

@media (max-width: 768px) {
  .g-table-header-cell,
  .g-table-cell {
    padding: 0.4rem 0.5rem;
    font-size: 0.78rem;
  }

  .g-table-header-cell {
    font-size: 0.72rem;
  }

  .g-table-search-input {
    min-width: 140px;
  }

  .g-icon-button {
    width: 36px;
    height: 36px;
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .g-table-header-cell,
  .g-table-cell {
    padding: 0.35rem 0.4rem;
    font-size: 0.72rem;
  }

  .g-table-header-cell {
    font-size: 0.65rem;
  }

  .g-table-badge {
    font-size: 0.62rem;
    padding: 0.08rem 0.35rem;
  }

  .g-table-header-actions {
    width: 60px;
  }

  .g-table-cell-actions {
    gap: 0.1rem;
  }

  .g-icon-button {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
}
</style>
