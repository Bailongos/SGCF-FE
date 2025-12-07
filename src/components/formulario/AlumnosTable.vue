<!-- src/components/alumnos/AlumnosTable.vue -->
<template>
  <div class="card">
    <div class="card-header">
      <div>
        <h3 class="card-title">Listado de alumnos</h3>
        <p class="card-subtitle">
          Busca, edita o elimina registros existentes.
        </p>
      </div>
      <div class="card-actions">
        <input
          v-model="localSearch"
          class="search-input"
          placeholder="Buscar por nombre, matrícula o email..."
        />
        <button
          class="btn btn-text"
          @click="$emit('reload')"
          :disabled="loading"
        >
          Recargar
        </button>
      </div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Alumno } from '../../services/alumnos';
import type { Carrera } from '../../services/carreras';

const props = withDefaults(defineProps<{
  alumnos: Alumno[];
  carreras: Carrera[];
  loading: boolean;
  error: string | null;
  search: string;
}>(), {
  alumnos: () => [],
  carreras: () => [],
  loading: false,
  error: null,
  search: '',
});

const emit = defineEmits<{
  (e: 'reload'): void;
  (e: 'edit', alumno: Alumno): void;
  (e: 'delete', matricula: string): void;
  (e: 'update:search', value: string): void;
}>();

const localSearch = computed({
  get: () => props.search ?? '',
  set: (val: string) => emit('update:search', val),
});

function getCarreraNombre(id: number): string {
  const c = props.carreras.find((c) => c.id_carrera === id);
  return c ? c.nombre : `ID ${id}`;
}

const filteredAlumnos = computed(() => {
  const term = (localSearch.value || '').toLowerCase().trim();
  if (!term) return props.alumnos;

  return props.alumnos.filter((a) => {
    return (
      a.matricula.toLowerCase().includes(term) ||
      a.nombre_completo.toLowerCase().includes(term) ||
      (a.email_institucional ?? '').toLowerCase().includes(term)
    );
  });
});
</script>

<style scoped>
.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 500;
  color: #202124;
}

.card-subtitle {
  font-size: 0.85rem;
  color: #5f6368;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-input {
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  border: 1px solid #dadce0;
  font-size: 0.85rem;
  min-width: 260px;
  outline: none;
}

.search-input:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 1px rgba(26, 115, 232, 0.2);
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

.btn-text {
  background: transparent;
  color: #1a73e8;
}

.btn-text:hover {
  background: rgba(26, 115, 232, 0.08);
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
