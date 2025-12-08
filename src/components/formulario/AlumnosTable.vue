<!-- src/components/alumnos/AlumnosTable.vue -->
<template>
  <SectionCard
    class="alumnos-table"
    icon="group"
    :title="titleToShow"
    :subtitle="subtitleToShow"
    density="comfortable"
  >
    <!-- Zona derecha del header: filtros y acciones -->
    <template #header-right>
      <div class="table-actions">
        <!-- Buscador -->
        <GoogleInput
          v-model="localSearch"
          class="table-search-input"
          size="sm"
          placeholder="Buscar por nombre, matrícula o email..."
        />

        <!-- Filtro por carrera (opcional, local) -->
        <GoogleSelect
          v-model="localCarreraFilter"
          class="table-career-select"
          :options="carreraOptions"
          placeholder="Todas las carreras"
          size="sm"
        />

        <!-- Botón recargar -->
        <GoogleButton
          variant="text"
          :disabled="loading"
          @click="$emit('reload')"
        >
          Recargar
        </GoogleButton>
      </div>
    </template>

    <!-- Error -->
    <p v-if="error" class="error">{{ error }}</p>

    <!-- Tabla -->
    <div v-if="filteredAlumnos.length" class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Matrícula</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Carrera</th>
            <th>Semestre</th>
            <th>Estado</th>
            <th class="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="al in filteredAlumnos"
            :key="al.matricula"
          >
            <td>{{ al.matricula }}</td>
            <td>{{ al.nombre_completo }}</td>
            <td>{{ al.email_institucional ?? '-' }}</td>
            <td>{{ al.telefono_contacto ?? '-' }}</td>
            <td>{{ getCarreraNombre(al.id_carrera) }}</td>
            <td>{{ al.semestre_actual }}</td>
            <td>
              <span
                class="chip"
                :class="al.activo ? 'chip-success' : 'chip-muted'"
              >
                {{ al.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="cell-actions">
              <button
                class="icon-button"
                title="Editar"
                @click="$emit('edit', al)"
              >
                ✏️
              </button>
              <button
                class="icon-button icon-danger"
                title="Eliminar"
                @click="$emit('delete', al.matricula)"
              >
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="empty">
      No hay alumnos que coincidan con el filtro.
    </p>
  </SectionCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Alumno } from '../../services/alumnos';
import type { Carrera } from '../../services/carreras';

// UI googlesca
import SectionCard from '../layout/sideCard.vue';
import GoogleInput from '../ui/input.vue';
import GoogleButton from '../ui/button.vue';
import GoogleSelect from '../ui/select.vue';

const props = withDefaults(defineProps<{
  alumnos: Alumno[];
  carreras: Carrera[];
  loading: boolean;
  error: string | null;
  search: string;

  // Para reutilizar el componente en otros lados
  title?: string;
  subtitle?: string;
}>(), {
  alumnos: () => [],
  carreras: () => [],
  loading: false,
  error: null,
  search: '',
  title: 'Listado de alumnos',
  subtitle: 'Busca, edita o elimina registros existentes.',
});

const emit = defineEmits<{
  (e: 'reload'): void;
  (e: 'edit', alumno: Alumno): void;
  (e: 'delete', matricula: string): void;
  (e: 'update:search', value: string): void;
}>();

const titleToShow = computed(() => props.title);
const subtitleToShow = computed(() => props.subtitle);

// v-model:search desde el padre
const localSearch = computed({
  get: () => props.search ?? '',
  set: (val: string) => emit('update:search', val),
});

// filtro local por carrera
const localCarreraFilter = ref<string | number | null>(null);

function getCarreraNombre(id: number): string {
  const c = props.carreras.find((c) => c.id_carrera === id);
  return c ? c.nombre : `ID ${id}`;
}

// opciones para el select de carrera
const carreraOptions = computed(() => [
  { value: '', label: 'Todas las carreras' },
  ...props.carreras.map((c) => ({
    value: c.id_carrera,
    label: c.nombre,
  })),
]);

const filteredAlumnos = computed(() => {
  const term = (localSearch.value || '').toLowerCase().trim();
  const carreraFilter = localCarreraFilter.value;

  let list = props.alumnos;

  // filtrar por carrera si hay filtro
  if (carreraFilter !== null && carreraFilter !== '') {
    const targetId = Number(carreraFilter);
    list = list.filter((a) => a.id_carrera === targetId);
  }

  if (!term) return list;

  return list.filter((a) => {
    return (
      a.matricula.toLowerCase().includes(term) ||
      a.nombre_completo.toLowerCase().includes(term) ||
      (a.email_institucional ?? '').toLowerCase().includes(term)
    );
  });
});
</script>

<style scoped>
.table-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.table-search-input {
  min-width: 240px;
}

.table-career-select {
  min-width: 200px;
}

.table-wrapper {
  margin-top: 0.75rem;
  border-radius: 12px;
  border: 1px solid #dadce0;
  overflow: hidden;
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

.col-actions {
  width: 80px;
}

.cell-actions {
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
}

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  font-size: 0.78rem;
  border: 1px solid transparent;
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

.icon-button {
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 999px;
  padding: 0.25rem 0.4rem;
  font-size: 0.9rem;
}

.icon-button:hover {
  background: rgba(60, 64, 67, 0.08);
}

.icon-danger {
  color: #d93025;
}

.icon-danger:hover {
  background: rgba(217, 48, 37, 0.12);
}

.error {
  color: #d93025;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.empty {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: #5f6368;
}
</style>
