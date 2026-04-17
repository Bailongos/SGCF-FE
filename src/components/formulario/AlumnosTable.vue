<!-- src/components/alumnos/AlumnosTable.vue -->
<template>
  <SectionCard class="alumnos-table" icon="group" :title="titleToShow" :subtitle="subtitleToShow" density="comfortable">
    <!-- Zona derecha del header: filtros y acciones -->
    <template #header-extra>
      <div class="table-actions">
        <!-- Buscador -->
        <GoogleInput v-model="localSearch" class="table-search-input" size="sm"
          placeholder="Buscar por nombre, matrícula o email..." />

        <!-- Filtro por carrera (opcional, local) - Deshabilitado para Coordinadores -->
        <GoogleSelect v-model="localCarreraFilter" class="table-career-select" :options="carreraOptions"
          placeholder="Todos los planes" size="sm" :disabled="!auth.can('filters.carrera.change')" />

        <GoogleSelect v-model="localSemestreFilter" class="table-semester-select" :options="semestreOptions"
          placeholder="Todos los semestres" size="sm" />

        <span class="chip chip-soft">Plan: {{ selectedCarreraLabel }}</span>

        <!-- Botón recargar -->
        <GoogleButton variant="text" :disabled="loading" @click="$emit('reload')">
          Recargar
        </GoogleButton>

        <GoogleButton
          v-if="selectedCount > 0"
          variant="outlined"
          :disabled="loading"
          @click="emitBulkEdit"
        >
          Editar selección ({{ selectedCount }})
        </GoogleButton>

        <GoogleButton
          v-if="selectedCount > 0"
          variant="text"
          :disabled="loading"
          style="color: var(--md-sys-color-error)"
          @click="emitBulkDelete"
        >
          Eliminar selección
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
            <th class="col-select">
              <input
                type="checkbox"
                class="row-select-checkbox"
                :checked="isAllFilteredSelected"
                :indeterminate.prop="isSomeFilteredSelected"
                @change="toggleSelectAllFiltered"
              />
            </th>
            <th>Matrícula</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Semestre</th>
            <th>Estado</th>
            <th class="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="al in filteredAlumnos" :key="al.matricula">
            <td class="cell-select">
              <input
                type="checkbox"
                class="row-select-checkbox"
                :checked="isSelected(al.matricula)"
                @change="toggleSelection(al.matricula, $event)"
              />
            </td>
            <td>{{ al.matricula }}</td>
            <td>
              <div class="student-name-cell">
                <strong>{{ al.nombre_completo }}</strong>
                <small class="student-plan">{{ getCarreraNombre(al.id_carrera) }}</small>
              </div>
            </td>
            <td>{{ al.email_institucional ?? '-' }}</td>
            <td>{{ al.telefono_contacto ?? '-' }}</td>
            <td>{{ al.semestre_actual }}</td>
            <td>
              <span class="chip" :class="al.activo ? 'chip-success' : 'chip-muted'">
                {{ al.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="cell-actions">
              <button class="icon-button" title="Editar" @click="$emit('edit', al)">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button class="icon-button icon-danger" title="Eliminar" @click="$emit('delete', al.matricula)">
                <span class="material-symbols-outlined">delete</span>
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
import { computed, ref, onMounted, watch } from 'vue';
import type { Alumno } from '../../services/alumnos';
import type { Carrera } from '../../services/carreras';
import { useAuthStore } from '../../stores/auth';
import { formatCarreraLabel } from '../../utils/carreras';

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
  (e: 'bulk-edit', matriculas: string[]): void;
  (e: 'bulk-delete', matriculas: string[]): void;
  (e: 'update:search', value: string): void;
}>();

const titleToShow = computed(() => props.title);
const subtitleToShow = computed(() => props.subtitle);

// v-model:search desde el padre
const localSearch = computed({
  get: () => props.search ?? '',
  set: (val: string) => emit('update:search', val),
});

const auth = useAuthStore();

// filtro local por carrera
const localCarreraFilter = ref<string | number | null>(auth.userCareerId ?? null);
const localSemestreFilter = ref<string | number | null>(null);

onMounted(() => {
  if (!auth.can('filters.carrera.change') && auth.userCareerId) {
    localCarreraFilter.value = auth.userCareerId;
  }
});

function getCarreraNombre(id: number): string {
  const c = props.carreras.find((c) => c.id_carrera === id);
  return c ? formatCarreraLabel(c) : `Carrera ${id}`;
}

// opciones para el select de carrera
const carreraOptions = computed(() => [
  { value: '', label: 'Todos los planes' },
  ...props.carreras.map((c) => ({
    value: c.id_carrera,
    label: formatCarreraLabel(c),
  })),
]);

const semestreOptions = computed(() => {
  const semestres = Array.from(
    new Set(
      props.alumnos
        .map((alumno) => Number(alumno.semestre_actual))
        .filter((semestre) => Number.isFinite(semestre) && semestre > 0),
    ),
  ).sort((a, b) => a - b);

  return [
    { value: '', label: 'Todos los semestres' },
    ...semestres.map((semestre) => ({
      value: semestre,
      label: `Semestre ${semestre}`,
    })),
  ];
});

const selectedCarreraLabel = computed(() => {
  if (localCarreraFilter.value === '' || localCarreraFilter.value === null) {
    return 'Todos los planes';
  }

  const selected = carreraOptions.value.find(
    (option) => Number(option.value) === Number(localCarreraFilter.value),
  );

  return selected?.label ?? `Plan #${localCarreraFilter.value}`;
});

const selectedMatriculas = ref<string[]>([]);

const filteredAlumnos = computed(() => {
  const term = (localSearch.value || '').toLowerCase().trim();
  const carreraFilter = localCarreraFilter.value;
  const semestreFilter = localSemestreFilter.value;

  let list = props.alumnos;

  // filtrar por carrera si hay filtro
  if (carreraFilter !== null && carreraFilter !== '') {
    const targetId = Number(carreraFilter);
    list = list.filter((a) => a.id_carrera === targetId);
  }

  if (semestreFilter !== null && semestreFilter !== '') {
    const targetSemestre = Number(semestreFilter);
    list = list.filter((a) => Number(a.semestre_actual) === targetSemestre);
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

const selectedCount = computed(() => selectedMatriculas.value.length);

const filteredMatriculas = computed(() =>
  filteredAlumnos.value.map((alumno) => alumno.matricula),
);

const isAllFilteredSelected = computed(() => {
  if (!filteredMatriculas.value.length) return false;
  const selected = new Set(selectedMatriculas.value);
  return filteredMatriculas.value.every((matricula) => selected.has(matricula));
});

const isSomeFilteredSelected = computed(() => {
  if (!filteredMatriculas.value.length) return false;
  const selected = new Set(selectedMatriculas.value);
  const count = filteredMatriculas.value.filter((matricula) => selected.has(matricula)).length;
  return count > 0 && count < filteredMatriculas.value.length;
});

function isSelected(matricula: string): boolean {
  return selectedMatriculas.value.includes(matricula);
}

function toggleSelection(matricula: string, event: Event) {
  const target = event.target as HTMLInputElement | null;
  const checked = Boolean(target?.checked);

  if (checked) {
    if (!selectedMatriculas.value.includes(matricula)) {
      selectedMatriculas.value = [...selectedMatriculas.value, matricula];
    }
    return;
  }

  selectedMatriculas.value = selectedMatriculas.value.filter((value) => value !== matricula);
}

function toggleSelectAllFiltered(event: Event) {
  const target = event.target as HTMLInputElement | null;
  const checked = Boolean(target?.checked);

  if (checked) {
    const merged = new Set([...selectedMatriculas.value, ...filteredMatriculas.value]);
    selectedMatriculas.value = Array.from(merged);
    return;
  }

  const visible = new Set(filteredMatriculas.value);
  selectedMatriculas.value = selectedMatriculas.value.filter((matricula) => !visible.has(matricula));
}

function emitBulkEdit() {
  if (!selectedMatriculas.value.length) return;
  emit('bulk-edit', [...selectedMatriculas.value]);
}

function emitBulkDelete() {
  if (!selectedMatriculas.value.length) return;
  emit('bulk-delete', [...selectedMatriculas.value]);
}

watch(
  () => props.alumnos,
  (current) => {
    const available = new Set(current.map((alumno) => alumno.matricula));
    selectedMatriculas.value = selectedMatriculas.value.filter((matricula) => available.has(matricula));
  },
);
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

.table-semester-select {
  min-width: 180px;
}

.student-name-cell {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.student-plan {
  font-size: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
}

.table-wrapper {
  margin-top: 0.75rem;
  border-radius: 12px;
  border: 1px solid var(--md-sys-color-outline-variant);
  overflow-x: auto;
  overflow-y: hidden;
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
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.col-select {
  width: 40px;
  text-align: center;
}

.table td {
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface);
}

.cell-select {
  text-align: center;
}

.row-select-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--md-sys-color-primary);
  cursor: pointer;
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
  background: var(--md-sys-color-success-container);
  border-color: var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-success);
}

.chip-muted {
  background: var(--md-sys-color-surface-container);
  border-color: var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface-variant);
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
  background: var(--md-sys-color-surface-container);
}

.icon-danger {
  color: var(--md-sys-color-error);
}

.icon-danger:hover {
  background: color-mix(in srgb, var(--md-sys-color-error), transparent 85%);
}

.error {
  color: var(--md-sys-color-error);
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.empty {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: var(--md-sys-color-on-surface-variant);
}
</style>
