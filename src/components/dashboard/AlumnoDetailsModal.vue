<!-- src/components/dashboard/AlumnoDetailsModal.vue -->
<template>
  <GoogleModal
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    icon="person"
    :title="`Detalles: ${alumnoData?.nombre_completo}`"
    subtitle="Información consolidada del alumno"
    maxWidth="1000px"
    density="comfortable"
    :showFooter="false"
  >
    <div v-if="alumnoData" class="details-container custom-scrollbar">
      <!-- Dashboard de Estado -->
      <div class="status-banner" :class="alumnoData.totalPendiente > 0 ? 'banner-danger' : 'banner-success'">
        <div class="status-banner-content">
          <span class="material-symbols-outlined status-icon">
            {{ alumnoData.totalPendiente > 0 ? 'warning' : 'check_circle' }}
          </span>
          <div class="status-text">
            <h3 class="status-title">
              {{ alumnoData.totalPendiente > 0 ? 'Adeudo Pendiente' : 'Al Día' }}
            </h3>
            <p class="status-subtitle">
              {{
                alumnoData?.totalPendiente > 0
                  ? 'Este alumno tiene cuentas por cobrar pendientes.'
                  : 'No hay adeudos registrados en el sistema.'
              }}
            </p>
          </div>
        </div>
        <div class="status-amount">
          <span class="amount-label">Total Adeudo</span>
          <span class="amount-value">{{ formatMoney(alumnoData.totalPendiente) }}</span>
        </div>
      </div>

      <div class="details-layout">
        <!-- Columna Izquierda: Información General -->
        <div class="details-column-info">
          <div class="details-section card">
            <div class="section-header">
              <h3 class="section-title">
                <span class="material-symbols-outlined">info</span>
                Información General
              </h3>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <label>Matrícula</label>
                <p>{{ alumnoData.matricula }}</p>
              </div>
              <div class="info-item">
                <label>Estado</label>
                <p>
                  <span :class="alumnoData.alumno.activo ? 'badge-active' : 'badge-inactive'">
                    {{ alumnoData.alumno.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </p>
              </div>
              <div class="info-item span-2">
                <label>Plan de Estudio</label>
                <p>{{ alumnoData.carrera }}</p>
              </div>
              <div class="info-item">
                <label>Semestre Actual</label>
                <p>{{ alumnoData.semestre_actual }} de {{ alumnoData.duracionCarrera }}</p>
              </div>
              <div class="info-item">
                <label>Ciclo Actual</label>
                <p>{{ alumnoData.cicloActual }}</p>
              </div>
              <div class="info-item span-2">
                <label>Email</label>
                <p>{{ alumnoData.alumno.email_institucional || '-' }}</p>
              </div>
              <div class="info-item span-2">
                <label>Teléfono</label>
                <p>{{ alumnoData.alumno.telefono_contacto || '-' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Cuentas y Observaciones -->
        <div class="details-column-data">
          <!-- Cuentas -->
          <div class="details-section card">
            <div class="section-header">
              <h3 class="section-title">
                <span class="material-symbols-outlined">receipt_long</span>
                Cuentas por Cobrar
              </h3>
              <GoogleButton size="sm" @click="$emit('add-cuenta', alumnoData.matricula)">
                <span class="material-symbols-outlined">add</span>
                Nueva cuenta
              </GoogleButton>
            </div>

            <div v-if="cuentas.length" class="mini-table-wrapper">
              <table class="mini-table">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Ciclo</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="cuenta in cuentas" :key="cuenta.id_cuenta">
                    <td><strong>{{ cuenta.concepto }}</strong></td>
                    <td>{{ getCicloNombre(cuenta.id_ciclo) }}</td>
                    <td class="font-numeric">{{ formatMoney(cuenta.monto) }}</td>
                    <td>
                      <span :class="cuenta.pagado ? 'text-success' : 'text-error'" class="status-dot">
                        {{ cuenta.pagado ? 'Pagado' : 'Pendiente' }}
                      </span>
                    </td>
                    <td class="cell-actions-mini">
                      <button class="mini-action-btn" @click="$emit('edit-cuenta', cuenta)">
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                      <button class="mini-action-btn btn-danger" @click="$emit('delete-cuenta', cuenta.id_cuenta)">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-panel">
              <p>No hay cuentas registradas.</p>
            </div>
          </div>

          <!-- Observaciones -->
          <div class="details-section card">
            <div class="section-header">
              <h3 class="section-title">
                <span class="material-symbols-outlined">comment</span>
                Observaciones
              </h3>
              <GoogleButton size="sm" variant="outlined" @click="$emit('add-observacion', alumnoData.matricula)">
                <span class="material-symbols-outlined">add_comment</span>
                Nueva nota
              </GoogleButton>
            </div>

            <div v-if="observaciones.length" class="observations-list">
              <div v-for="obs in observaciones" :key="obs.id_observacion" class="observation-card">
                <div class="obs-header">
                  <span class="obs-author">{{ getUsuarioNombre(obs.id_autor) }}</span>
                  <span class="obs-date">{{ formatDate(obs.fecha) }}</span>
                </div>
                <div class="obs-tag-row">
                  <span class="obs-tag">{{ getTipoLabel(obs) }}</span>
                </div>
                <p class="obs-detail">{{ obs.detalle }}</p>
                <div class="obs-actions">
                  <button @click="$emit('edit-observacion', obs)">Editar</button>
                  <button class="text-error" @click="$emit('delete-observacion', obs.id_observacion)">Eliminar</button>
                </div>
              </div>
            </div>
            <div v-else class="empty-panel">
              <p>Sin observaciones.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </GoogleModal>
</template>

<script setup lang="ts">
import { type Alumno } from '../../services/alumnos';
import { type Cuenta } from '../../services/cuentas';
import { type Observacion } from '../../services/observaciones';
import GoogleModal from '../modal/modal.vue';
import GoogleButton from '../ui/button.vue';

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

defineProps<{
  modelValue: boolean;
  alumnoData: DashboardRow | null;
  cuentas: Cuenta[];
  observaciones: Observacion[];
  getCicloNombre: (id: number) => string;
  getUsuarioNombre: (id: number | null) => string;
  formatDate: (iso: string) => string;
  getTipoLabel: (obs: Observacion) => string;
}>();

defineEmits([
  'update:modelValue',
  'add-cuenta',
  'edit-cuenta',
  'delete-cuenta',
  'add-observacion',
  'edit-observacion',
  'delete-observacion'
]);

const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};
</script>

<style scoped>
.details-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-height: 80vh;
  overflow-y: auto;
  padding: 0.5rem;
}

/* Banner de Estado */
.status-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-radius: 20px;
  animation: banner-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes banner-pop {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.banner-danger {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

.banner-success {
  background: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
}

.status-banner-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-icon {
  font-size: 40px;
}

.status-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.status-subtitle {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.status-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.amount-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  opacity: 0.8;
}

.amount-value {
  font-size: 2rem;
  font-weight: 800;
  font-family: 'Roboto Mono', monospace;
}

/* Layout */
.details-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .details-layout {
    grid-template-columns: 1fr;
  }
}

.details-section {
  padding: 1.25rem;
  transition: box-shadow 0.2s;
}

.card {
  background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--md-sys-color-primary);
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.info-item label {
  display: block;
  font-size: 0.75rem;
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.info-item p {
  margin: 0;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.span-2 {
  grid-column: span 2;
}

.badge-active { color: var(--md-sys-color-tertiary); font-weight: 700; }
.badge-inactive { color: var(--md-sys-color-outline); font-weight: 700; }

/* Mini Table */
.mini-table-wrapper {
  overflow-x: auto;
}

.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.mini-table th {
  text-align: left;
  padding: 0.5rem;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface-variant);
}

.mini-table td {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.status-dot::before {
  content: '●';
  margin-right: 0.3rem;
}

.text-success { color: var(--md-sys-color-tertiary); }
.text-error { color: var(--md-sys-color-error); }

.cell-actions-mini {
  display: flex;
  gap: 0.25rem;
}

.mini-action-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--md-sys-color-on-surface-variant);
}

.mini-action-btn:hover { color: var(--md-sys-color-primary); }
.mini-action-btn.btn-danger:hover { color: var(--md-sys-color-error); }

/* Observations List */
.observations-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.observation-card {
  padding: 1rem;
  background: var(--md-sys-color-surface-container);
  border-radius: 12px;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.obs-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  margin-bottom: 0.4rem;
}

.obs-author { font-weight: 700; color: var(--md-sys-color-primary); }
.obs-date { color: var(--md-sys-color-on-surface-variant); }

.obs-tag-row { margin-bottom: 0.5rem; }
.obs-tag {
  font-size: 0.65rem;
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 700;
}

.obs-detail {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--md-sys-color-on-surface);
}

.obs-actions {
  margin-top: 0.6rem;
  display: flex;
  gap: 0.75rem;
}

.obs-actions button {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--md-sys-color-primary);
}

.empty-panel {
  padding: 1.5rem;
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
  background: var(--md-sys-color-surface-container-lowest);
  border-radius: 12px;
  font-style: italic;
  font-size: 0.9rem;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--md-sys-color-outline-variant);
  border-radius: 10px;
}
</style>
