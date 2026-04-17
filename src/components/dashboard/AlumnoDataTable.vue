<!-- src/components/dashboard/AlumnoDataTable.vue -->
<template>
  <div class="table-container">
    <div class="table-responsive">
      <table class="g-table">
        <thead>
          <tr>
            <th class="col-select">
              <input
                type="checkbox"
                class="g-checkbox"
                :checked="isAllSelected"
                :indeterminate.prop="isSomeSelected"
                @change="$emit('toggle-all', ($event.target as HTMLInputElement).checked)"
              />
            </th>
            <th>Matrícula</th>
            <th>Nombre Completo</th>
            <th>Grado / Semestre</th>
            <th>Ciclo Escolar</th>
            <th>Cuentas</th>
            <th>Total Adeudo</th>
            <th>Estado</th>
            <th class="col-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in data"
            :key="row.matricula"
            :class="{ 'row-has-debt': row.totalPendiente > 0, 'row-selected': isSelected(row.matricula) }"
            @click="$emit('toggle-row', row.matricula, !isSelected(row.matricula))"
          >
            <td class="cell-select" @click.stop>
              <input
                type="checkbox"
                class="g-checkbox"
                :checked="isSelected(row.matricula)"
                @change="$emit('toggle-row', row.matricula, ($event.target as HTMLInputElement).checked)"
              />
            </td>
            <td class="cell-matricula">
              <span class="font-mono">{{ row.matricula }}</span>
            </td>
            <td>
              <div class="cell-name-info">
                <span class="name-text">{{ row.nombre_completo }}</span>
                <span class="plan-text">{{ row.carrera }}</span>
              </div>
            </td>
            <td class="cell-centered">
              <div class="semestre-chip" :title="`Plan de ${row.duracionCarrera} semestres`">
                {{ row.semestre_actual }} / {{ row.duracionCarrera }}
              </div>
            </td>
            <td>{{ row.cicloActual }}</td>
            <td class="cell-centered">
              <span v-if="row.cuentasPendientes > 0" class="count-badge badge-error">
                {{ row.cuentasPendientes }}
              </span>
              <span v-else class="count-badge badge-success">0</span>
            </td>
            <td class="cell-money">
              <span :class="row.totalPendiente > 0 ? 'text-error' : 'text-success'" class="money-text">
                {{ formatMoney(row.totalPendiente) }}
              </span>
            </td>
            <td>
              <div class="status-chip" :class="getStatusClass(row)">
                {{ getStatusText(row) }}
              </div>
            </td>
            <td class="cell-actions" @click.stop>
              <button class="action-btn" title="Ver detalles" @click="$emit('view', row)">
                <span class="material-symbols-outlined">visibility</span>
              </button>
              <button class="action-btn" title="Editar" @click="$emit('edit', row.alumno)">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <button class="action-btn btn-danger" title="Eliminar" @click="$emit('delete', row.matricula)">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!data.length" class="empty-state">
      <span class="material-symbols-outlined empty-icon">group_off</span>
      <p>No se encontraron alumnos con los filtros seleccionados.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Alumno } from '../../services/alumnos';

interface DashboardRow {
  alumno: Alumno;
  matricula: string;
  nombre_completo: string;
  carrera: string;
  duracionCarrera: number;
  semestre_actual: number;
  cicloActual: string;
  cuentasPendientes: number;
  totalPendiente: number;
}

const props = defineProps<{
  data: DashboardRow[];
  selectedMatriculas: string[];
  isAllSelected: boolean;
  isSomeSelected: boolean;
}>();

defineEmits([
  'toggle-all',
  'toggle-row',
  'view',
  'edit',
  'delete'
]);

const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

const isSelected = (matricula: string) => {
  return props.selectedMatriculas.includes(matricula);
};

const getStatusClass = (row: DashboardRow) => {
  if (row.totalPendiente === 0) return 'status-success';
  if (!row.alumno.activo) return 'status-error';
  return 'status-warning';
};

const getStatusText = (row: DashboardRow) => {
  if (row.totalPendiente === 0) return 'Al día';
  if (!row.alumno.activo) return 'Inactivo + Adeudo';
  return 'Con adeudo';
};
</script>

<style scoped>
.table-container {
  background: var(--md-sys-color-surface);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.table-responsive {
  overflow-x: auto;
}

.g-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.g-table th {
  text-align: left;
  padding: 1rem;
  background: var(--md-sys-color-surface-container-low);
  color: var(--md-sys-color-on-surface-variant);
  font-weight: 600;
  border-bottom: 2px solid var(--md-sys-color-outline-variant);
  white-space: nowrap;
}

.g-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  vertical-align: middle;
  color: var(--md-sys-color-on-surface);
  transition: background 0.15s ease;
}

.g-table tr:last-child td {
  border-bottom: none;
}

.g-table tr:hover td {
  background: var(--md-sys-color-surface-container-lowest);
  cursor: pointer;
}

.row-selected td {
  background: var(--md-sys-color-primary-container) !important;
  color: var(--md-sys-color-on-primary-container) !important;
}

/* Columna de selección */
.col-select, .cell-select {
  width: 48px;
  text-align: center;
}

.g-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--md-sys-color-primary);
}

/* Matrícula */
.font-mono {
  font-family: 'Roboto Mono', monospace;
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--md-sys-color-primary);
}

/* Info de Nombre */
.cell-name-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.name-text {
  font-weight: 600;
}

.plan-text {
  font-size: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
}

/* Semestre Chip */
.semestre-chip {
  display: inline-flex;
  padding: 0.2rem 0.5rem;
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Badges */
.count-badge {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
}

.badge-error {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

.badge-success {
  background: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
}

/* Dinero */
.cell-money {
  text-align: right;
}

.money-text {
  font-weight: 700;
  font-family: 'Roboto Mono', monospace;
}

.text-error { color: var(--md-sys-color-error); }
.text-success { color: var(--md-sys-color-tertiary); }

/* Status Chip */
.status-chip {
  display: inline-flex;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-success {
  background: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
}

.status-warning {
  background: var(--md-sys-color-warning-container, #fff4e5);
  color: var(--md-sys-color-warning, #663c00);
}

.status-error {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

/* Acciones */
.cell-actions {
  text-align: right;
  white-space: nowrap;
}

.action-btn {
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--md-sys-color-on-surface-variant);
  transition: background 0.2s;
}

.action-btn:hover {
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-primary);
}

.action-btn.btn-danger:hover {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-error);
}

.action-btn .material-symbols-outlined {
  font-size: 20px;
}

/* Empty State */
.empty-state {
  padding: 3rem;
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.cell-centered {
  text-align: center;
}
</style>
