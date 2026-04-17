<!-- src/components/dashboard/DashboardFilters.vue -->
<template>
  <div class="filters-container">
    <div class="filter-group main-filters">
      <GoogleInput
        :modelValue="search"
        @update:modelValue="$emit('update:search', $event)"
        class="filter-search"
        size="sm"
        placeholder="Buscar matrícula, nombre o plan..."
        icon="search"
      />
      
      <GoogleSelect
        :modelValue="filterCarrera"
        @update:modelValue="$emit('update:filterCarrera', $event)"
        class="filter-select"
        :options="carreraOptions"
        placeholder="Todos los planes"
        size="sm"
        :disabled="!canChangeCarrera"
      />
      
      <GoogleSelect
        :modelValue="filterCiclo"
        @update:modelValue="$emit('update:filterCiclo', $event)"
        class="filter-select"
        :options="cicloOptions"
        placeholder="Todos los ciclos"
        size="sm"
      />
      
      <GoogleSelect
        :modelValue="filterSemestre"
        @update:modelValue="$emit('update:filterSemestre', $event)"
        class="filter-select"
        :options="semestreOptions"
        placeholder="Todos los semestres"
        size="sm"
      />
      
      <GoogleSelect
        :modelValue="filterPago"
        @update:modelValue="$emit('update:filterPago', $event)"
        class="filter-select"
        :options="pagoOptions"
        placeholder="Estado de pago"
        size="sm"
      />
    </div>

    <div class="filter-actions">
      <GoogleButton variant="text" size="sm" @click="$emit('reload')">
        <span class="material-symbols-outlined">refresh</span>
        Recargar
      </GoogleButton>
      
      <div class="bulk-actions" v-if="selectedCount > 0">
        <GoogleButton
          variant="outlined"
          size="sm"
          @click="$emit('bulk-edit')"
        >
          <span class="material-symbols-outlined">edit_square</span>
          Editar selección ({{ selectedCount }})
        </GoogleButton>
        
        <GoogleButton
          variant="text"
          size="sm"
          class="btn-danger"
          @click="$emit('bulk-delete')"
        >
          <span class="material-symbols-outlined">delete_sweep</span>
          Eliminar
        </GoogleButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GoogleInput from '../ui/input.vue';
import GoogleSelect, { type SelectOption } from '../ui/select.vue';
import GoogleButton from '../ui/button.vue';

defineProps<{
  search: string;
  filterCarrera: string | number;
  filterCiclo: string | number;
  filterSemestre: string | number;
  filterPago: string;
  carreraOptions: SelectOption[];
  cicloOptions: SelectOption[];
  semestreOptions: SelectOption[];
  canChangeCarrera: boolean;
  selectedCount: number;
}>();

defineEmits([
  'update:search',
  'update:filterCarrera',
  'update:filterCiclo',
  'update:filterSemestre',
  'update:filterPago',
  'reload',
  'bulk-edit',
  'bulk-delete'
]);

const pagoOptions: SelectOption[] = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Con adeudo' },
  { value: 'pagado', label: 'Al día' },
];
</script>

<style scoped>
.filters-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--md-sys-color-surface-container-lowest);
  border-radius: 16px;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.main-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  align-items: center;
}

.filter-search {
  grid-column: span 2;
}

@media (max-width: 1024px) {
  .filter-search {
    grid-column: span 1;
  }
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  padding-top: 0.75rem;
}

.bulk-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  animation: slide-in 0.2s ease-out;
}

@keyframes slide-in {
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
}

.btn-danger {
  color: var(--md-sys-color-error) !important;
}

.btn-danger:hover {
  background-color: var(--md-sys-color-error-container) !important;
}
</style>
