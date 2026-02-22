<template>
  <div class="admin-filters">
    <GoogleInput
      :modelValue="search"
      @update:modelValue="emit('update:search', String($event ?? ''))"
      class="filter-search"
      label="Buscar"
      placeholder="Usuario o email"
      size="sm"
    />

    <GoogleSelect
      :modelValue="role"
      @update:modelValue="emit('update:role', $event)"
      :options="roleOptions"
      class="filter-select"
      label="Rol"
      placeholder="Todos"
      size="sm"
    />

    <GoogleSelect
      :modelValue="career"
      @update:modelValue="emit('update:career', $event)"
      :options="careerOptions"
      class="filter-select"
      label="Carrera"
      placeholder="Todas"
      size="sm"
    />

    <GoogleSelect
      :modelValue="status"
      @update:modelValue="emit('update:status', $event)"
      :options="statusOptions"
      class="filter-select"
      label="Estado"
      placeholder="Todos"
      size="sm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import GoogleInput from '../ui/input.vue';
import GoogleSelect, { type SelectOption } from '../ui/select.vue';

interface Option {
  value: string | number | null;
  label: string;
}

const props = defineProps<{
  search: string;
  role: string | number | null;
  career: string | number | null;
  status: string | number | null;
  roles: Option[];
  careers: Option[];
}>();

const emit = defineEmits<{
  (e: 'update:search', value: string): void;
  (e: 'update:role', value: string | number | null): void;
  (e: 'update:career', value: string | number | null): void;
  (e: 'update:status', value: string | number | null): void;
}>();

const roleOptions = computed<SelectOption[]>(() => [
  { value: '', label: 'Todos los roles' },
  ...props.roles,
]);

const careerOptions = computed<SelectOption[]>(() => [
  { value: '', label: 'Todas las carreras' },
  { value: 'global', label: 'Global' },
  ...props.careers,
]);

const statusOptions: SelectOption[] = [
  { value: '', label: 'Todos' },
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'pendiente', label: 'Pendiente' },
];
</script>

<style scoped>
.admin-filters {
  display: grid;
  grid-template-columns: minmax(220px, 2fr) repeat(3, minmax(160px, 1fr));
  gap: 0.75rem;
}

.filter-search,
.filter-select {
  width: 100%;
}

@media (max-width: 980px) {
  .admin-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .admin-filters {
    grid-template-columns: 1fr;
  }
}
</style>
