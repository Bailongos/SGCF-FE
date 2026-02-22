<!-- src/views/DashboardAlumnosView.vue -->
<template>
  <section class="page g-page-animate">
    <!-- Header estilo Google -->
    <header class="page-header">
      <div>
        <h2 class="page-title">Gestión Integrada de Alumnos</h2>
        <p class="page-subtitle">
          Vista unificada: datos del alumno, semestre, ciclo escolar y cuentas por cobrar.
        </p>
      </div>

      <div class="page-header-meta">
        <span class="chip chip-soft">
          Total alumnos: <strong>{{ alumnos.length }}</strong>
        </span>
        <span class="chip chip-soft">
          Pendiente: <strong>{{ formatMoney(totalPendiente) }}</strong>
        </span>

        <GoogleButton v-if="auth.can('action.catalogos.manage')" size="sm" color="#1a73e8" @click="showCarrerasManager = true">
          <span class="material-symbols-outlined">school</span>
          Gestionar Planes de Estudio
        </GoogleButton>

        <GoogleButton v-if="auth.can('action.catalogos.manage')" size="sm" color="#1a73e8" @click="showConceptosManager = true">
          <span class="material-symbols-outlined">receipt_long</span>
          Gestionar Conceptos
        </GoogleButton>

        <!-- Botón "Nuevo alumno" - Siempre visible en esta vista -->
        <GoogleButton size="sm" color="#1a73e8" @click="openCreateAlumno">
          <span class="material-symbols-outlined">add</span>
          Nuevo alumno
        </GoogleButton>
      </div>
    </header>

    <!-- Tabla integrada -->
    <SectionCard class="dashboard-table" icon="dashboard" title="Alumnos - Información Integrada"
      subtitle="Consulta y gestiona datos consolidados de alumnos, ciclos y cuentas." density="comfortable">
      <!-- Zona derecha del header: filtros y acciones -->
      <template #header-extra>
        <div class="table-actions">
          <!-- Buscador -->
          <GoogleInput v-model="search" class="table-search-input" size="sm"
            placeholder="Buscar por matrícula, nombre o plan..." />

          <!-- Filtro por plan de estudio - Deshabilitado para Coordinadores -->
          <GoogleSelect v-model="filterCarrera" class="table-filter-select" :options="carreraOptions"
            placeholder="Todos los planes" size="sm" :disabled="!auth.can('filters.carrera.change')" />

          <!-- Filtro por ciclo -->
          <GoogleSelect v-model="filterCiclo" class="table-filter-select" :options="cicloOptions"
            placeholder="Todos los ciclos" size="sm" />

          <!-- Filtro por semestre -->
          <GoogleSelect v-model="filterSemestre" class="table-filter-select" :options="semestreOptions"
            placeholder="Todos los semestres" size="sm" />

          <span class="chip chip-soft">Plan: {{ selectedCarreraLabel }}</span>

          <!-- Filtro por estado de pago -->
          <GoogleSelect v-model="filterPago" class="table-filter-select" :options="[
            { value: '', label: 'Todos' },
            { value: 'pendiente', label: 'Con adeudo' },
            { value: 'pagado', label: 'Pagado' },
          ]" placeholder="Filtrar por pago" size="sm" />

          <!-- Botón recargar -->
          <GoogleButton variant="text" :disabled="loading" @click="loadData">
            Recargar
          </GoogleButton>
        </div>
      </template>

      <!-- Error -->
      <p v-if="error" class="error">{{ error }}</p>

      <!-- Tabla -->
      <div v-if="filteredData.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Nombre Completo</th>
              <th>Semestre</th>
              <th>Ciclo Escolar</th>
              <th>Cuentas Pendientes</th>
              <th>Total Adeudo</th>
              <th>Estado</th>
              <th class="col-actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredData" :key="row.matricula" :class="{ 'row-has-debt': row.totalPendiente > 0 }">
              <td class="cell-matricula">
                <strong>{{ row.matricula }}</strong>
              </td>
              <td>
                <div class="cell-name">
                  <span>{{ row.nombre_completo }}</span>
                  <small class="cell-subtle-plan">{{ row.carrera }}</small>
                </div>
              </td>
              <td class="cell-centered">
                <span class="chip chip-info" :title="'Plan de ' + row.duracionCarrera + ' semestres'">{{
                  row.semestre_actual
                }}/{{ row.duracionCarrera }}</span>
              </td>
              <td>{{ row.cicloActual }}</td>
              <td class="cell-centered">
                <span v-if="row.cuentasPendientes > 0" class="badge badge-danger">
                  {{ row.cuentasPendientes }}
                </span>
                <span v-else class="badge badge-success">0</span>
              </td>
              <td class="cell-money">
                <strong :class="row.totalPendiente > 0 ? 'text-danger' : 'text-success'">
                  {{ formatMoney(row.totalPendiente) }}
                </strong>
              </td>
              <td>
                <span class="chip" :class="{
                  'chip-success': !row.totalPendiente,
                  'chip-danger': row.totalPendiente > 0 && !row.alumno.activo,
                  'chip-warning': row.totalPendiente > 0 && row.alumno.activo,
                }">
                  {{
                    !row.totalPendiente
                      ? 'Al día'
                      : row.alumno.activo
                        ? 'Adeudo'
                        : 'Inactivo + Adeudo'
                  }}
                </span>
              </td>
              <td class="cell-actions">
                <button class="icon-button action-view" title="Ver detalles" @click="openDetails(row)">
                  <span class="material-symbols-outlined">visibility</span>
                </button>
                <button class="icon-button action-edit" title="Editar alumno" @click="editAlumno(row.alumno)">
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button v-if="row.totalPendiente > 0" class="icon-button action-payments" title="Nueva cuenta"
                  @click="openNewCuenta(row.matricula)">
                  <span class="material-symbols-outlined">payments</span>
                </button>
                <button class="icon-button action-delete" title="Eliminar alumno" @click="deleteAlumno(row.matricula)">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="empty">
        No hay alumnos que coincidan con los filtros seleccionados.
      </p>
    </SectionCard>

    <!-- Modal: Gestionar Carreras -->
    <GoogleModal v-model="showCarrerasManager" title="Gestionar Planes de Estudio" maxWidth="1200px" :showFooter="false"
      density="comfortable">
      <CarrerasManager @update="loadData" />
    </GoogleModal>

    <!-- Modal: Gestionar Conceptos -->
    <GoogleModal v-model="showConceptosManager" title="Gestionar Conceptos de Pago" maxWidth="1200px"
      :showFooter="false" density="comfortable">
      <ConceptosManager @update="loadData" />
    </GoogleModal>

    <!-- Modal: Detalles del alumno -->
    <GoogleModal v-model="showDetailsModal" icon="person" :title="`Detalles: ${selectedRowComputed?.nombre_completo}`"
      subtitle="Información consolidada del alumno" maxWidth="900px" density="comfortable">
      <div v-if="selectedRowComputed" class="details-container">
        <!-- Dashboard/Banner de Estado Principal -->
        <div class="status-banner" :class="selectedRowComputed.totalPendiente > 0 ? 'banner-danger' : 'banner-success'">
          <div class="status-banner-content">
            <span class="material-symbols-outlined status-icon">
              {{ selectedRowComputed.totalPendiente > 0 ? 'warning' : 'check_circle' }}
            </span>
            <div class="status-text">
              <h3 class="status-title">
                {{ selectedRowComputed.totalPendiente > 0 ? 'Adeudo Pendiente' : 'Al Día' }}
              </h3>
              <p class="status-subtitle">
                {{
                  selectedRowComputed?.totalPendiente > 0
                    ? 'Este alumno tiene cuentas por cobrar.'
                    : 'No hay adeudos registrados.'
                }}
              </p>
            </div>
          </div>
          <div class="status-amount">
            {{ formatMoney(selectedRowComputed.totalPendiente) }}
          </div>
        </div>

        <!-- Sección 1: Resumen de Cuentas con acciones (PUESTO PRIMERO) -->
        <div class="details-section highlight-section">
          <div class="section-header">
            <h3 class="details-section-title">
              <span class="material-symbols-outlined section-icon">receipt_long</span>
              Cuentas por Cobrar
            </h3>
            <GoogleButton size="sm" variant="filled" color="#1a73e8"
              @click="openNewCuentaFromDetails(selectedRowComputed.matricula)">
              <span class="material-symbols-outlined">add</span>
              Nueva cuenta
            </GoogleButton>
          </div>

          <div v-if="selectedRowCuentas.length" class="cuentas-table-wrapper">
            <table class="cuentas-table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Ciclo</th>
                  <th class="cell-money">Monto</th>
                  <th>Estado</th>
                  <th>Fecha Pago</th>
                  <th class="cell-actions-small">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cuenta in selectedRowCuentas" :key="cuenta.id_cuenta">
                  <td><strong>{{ cuenta.concepto }}</strong></td>
                  <td>{{ getCicloNombre(cuenta.id_ciclo) }}</td>
                  <td class="cell-money font-numeric">{{ formatMoney(cuenta.monto) }}</td>
                  <td>
                    <span :class="cuenta.pagado ? 'badge badge-success' : 'badge badge-danger'">
                      {{ cuenta.pagado ? 'Pagado' : 'Pendiente' }}
                    </span>
                  </td>
                  <td><span class="text-muted">{{ cuenta.fecha_pago ?? '-' }}</span></td>
                  <td class="cell-actions-small">
                    <button class="icon-button-small action-edit-small" title="Editar" @click="editCuenta(cuenta)">
                      <span class="material-symbols-outlined" style="font-size: 1.1rem">edit</span>
                    </button>
                    <button class="icon-button-small action-delete-small" title="Eliminar"
                      @click="deleteCuenta(cuenta.id_cuenta)">
                      <span class="material-symbols-outlined" style="font-size: 1.1rem">delete</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state-panel">
            <span class="material-symbols-outlined empty-icon">sentiment_satisfied</span>
            <p>No hay cuentas registradas para este alumno.</p>
          </div>
        </div>

        <!-- Sección 2: Datos del Alumno -->
        <div class="details-section">
          <h3 class="details-section-title">
            <span class="material-symbols-outlined section-icon">person</span>
            Información del Alumno
          </h3>
          <div class="details-grid">
            <div class="detail-field">
              <label>Matrícula</label>
              <p class="font-medium">{{ selectedRowComputed.matricula }}</p>
            </div>
            <div class="detail-field">
              <label>Nombre Completo</label>
              <p class="font-medium">{{ selectedRowComputed.nombre_completo }}</p>
            </div>
            <div class="detail-field">
              <label>Plan de Estudio</label>
              <p>{{ selectedRowComputed.carrera }}</p>
            </div>
            <div class="detail-field">
              <label>Semestre Actual</label>
              <p><span class="chip chip-info">{{ selectedRowComputed.semestre_actual }} de {{
                selectedRowComputed.duracionCarrera }}
                  semestres</span></p>
            </div>
            <div class="detail-field">
              <label>Email Institucional</label>
              <p>{{ selectedRowComputed.alumno.email_institucional || '-' }}</p>
            </div>
            <div class="detail-field">
              <label>Teléfono</label>
              <p>{{ selectedRowComputed.alumno.telefono_contacto || '-' }}</p>
            </div>
            <div class="detail-field">
              <label>Ciclo Escolar</label>
              <p>{{ selectedRowComputed.cicloActual }}</p>
            </div>
            <div class="detail-field">
              <label>Estado en Sistema</label>
              <p>
                <span :class="selectedRowComputed.alumno.activo ? 'badge badge-success' : 'badge badge-muted'">
                  {{ selectedRowComputed.alumno.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- Sección 3: Observaciones -->
        <div class="details-section">
          <div class="section-header">
            <h3 class="details-section-title">
              <span class="material-symbols-outlined section-icon">comment</span>
              Observaciones
            </h3>
            <GoogleButton size="sm" variant="outlined" color="#5f6368"
              @click="openNewObservacion(selectedRowComputed.matricula)">
              <span class="material-symbols-outlined">add_comment</span>
              Añadir nota
            </GoogleButton>
          </div>
          <div v-if="selectedRowObservaciones.length" class="cuentas-table-wrapper">
            <table class="cuentas-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Autor</th>
                  <th>Taller</th>
                  <th>Detalle</th>
                  <th class="cell-actions-small">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="obs in selectedRowObservaciones" :key="obs.id_observacion">
                  <td class="text-muted text-small">{{ formatDate(obs.fecha) }}</td>
                  <td>{{ getUsuarioNombre(obs.id_autor) }}</td>
                  <td>{{ formatObservacionTaller(obs.taller) }}</td>
                  <td>{{ obs.detalle }}</td>
                  <td class="cell-actions-small">
                    <button class="icon-button-small action-edit-small" title="Editar" @click="editObservacion(obs)"><span
                        class="material-symbols-outlined" style="font-size: 1.1rem">edit</span></button>
                    <button class="icon-button-small action-delete-small" title="Eliminar"
                      @click="deleteObservacion(obs.id_observacion)"><span class="material-symbols-outlined"
                        style="font-size: 1.1rem">delete</span></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state-panel">
            <p>No hay observaciones para este alumno.</p>
          </div>
        </div>
      </div>
    </GoogleModal>

    <!-- Modal: Crear/Editar alumno -->
    <GoogleModal v-model="showAlumnoModal" :icon="isEditingAlumno ? 'edit' : 'school'"
      :title="isEditingAlumno ? 'Editar alumno' : 'Alta de alumno'"
      :subtitle="isEditingAlumno
        ? 'Actualiza datos generales y adeudos iniciales.'
        : 'Captura datos del alumno y, si aplica, agrega una o varias cuentas por cobrar.'"
      maxWidth="920px" density="comfortable"
      :showFooter="false" :showAddAnother="!isEditingAlumno" v-model:addAnother="addAnotherAlumno">
      <div class="alumno-modal-shell">
        <AlumnosForm v-if="alumnoForm" :form="alumnoForm as any" :carreras="carreras" :conceptos="conceptos"
          :ciclos="ciclosEscolares" :metodos-pago="metodos" :enable-initial-debt="true"
          :is-editing="isEditingAlumno" :loading="loadingSave"
          @submit="handleAlumnoSubmit" @cancel-edit="handleAlumnoCancel" @open-bulk-modal="showBulkModal = true"
          @download-template="downloadTemplate" />
      </div>
    </GoogleModal>

    <!-- Modal: Carga masiva -->
    <AlumnosBulkModal v-model="showBulkModal" :file-name="bulkFileName" :rows="bulkRows" :errors="bulkErrors"
      :parsing="bulkParsing" :loading="bulkLoading" :progress="bulkProgress" @file-change="onBulkFileChange"
      @upload="handleBulkUpload" />

    <!-- Modal: Crear/Editar cuenta -->
    <GoogleModal v-model="showCuentaModal" :icon="isEditingCuenta ? 'edit' : 'request_quote'"
      :title="isEditingCuenta ? 'Editar cuenta' : 'Nueva cuenta por cobrar'"
      :subtitle="isEditingCuenta ? 'Actualiza los datos de la cuenta.' : 'Registra un adeudo para el alumno'"
      maxWidth="700px" density="comfortable" :confirmLoading="loadingSave"
      :confirmText="isEditingCuenta ? 'Actualizar' : 'Guardar'" cancelText="Cancelar" :showAddAnother="!isEditingCuenta"
      v-model:addAnother="addAnotherCuenta" @confirm="handleCuentaSubmit" @cancel="handleCuentaCancel">
      <form v-if="cuentaForm" @submit.prevent="handleCuentaSubmit" class="cuenta-form">
        <div class="form-grid">
          <GoogleInput v-model="cuentaForm.matricula" label="Matrícula" disabled />
          <GoogleSelect v-model="cuentaForm.concepto" :options="availableConceptoOptionsForCuenta" label="Concepto *"
            placeholder="Selecciona concepto..." required @update:modelValue="onConceptoDashboardChange" />
          <p v-if="!availableConceptoOptionsForCuenta.length" class="form-inline-hint span-2">
            Este alumno ya tiene cuentas para todos los conceptos en el ciclo seleccionado.
          </p>
          <GoogleSelect v-model="cuentaForm.id_ciclo" :options="cicloOptions" label="Ciclo Escolar *"
            placeholder="Selecciona ciclo..." required />
          <GoogleInput v-model.number="cuentaForm.monto" label="Monto *" type="number" step="0.01" min="0"
            placeholder="0.00" required />
          <label class="field-checkbox span-2">
            <input v-model="cuentaForm.pagado" type="checkbox" />
            <span>Marcar como pagado</span>
          </label>
          <div class="field" v-if="cuentaForm.pagado">
            <label class="g-input-label" style="font-size:0.8rem;color:#5f6368;">Fecha de pago</label>
            <input v-model="cuentaForm.fecha_pago" type="date" class="g-input-container g-input"
              style="width: 100%; border: 1px solid #dadce0; border-radius: 8px; padding: 0.4rem 0.7rem; font-family: inherit; font-size: 0.9rem;" />
          </div>
          <GoogleSelect v-if="cuentaForm.pagado" v-model="cuentaForm.id_metodo" :options="metodoOptions"
            label="Método de pago" placeholder="Selecciona un método..." size="md" />
        </div>
      </form>
    </GoogleModal>

    <!-- Modal: Crear/Editar Observación -->
    <GoogleModal v-model="showObservacionModal" :icon="isEditingObservacion ? 'edit_note' : 'note_add'"
      :title="isEditingObservacion ? 'Editar observación' : 'Nueva observación'"
      subtitle="Añade una nota o seguimiento para el alumno." maxWidth="600px" density="comfortable"
      :confirmLoading="loadingSave" :confirmText="isEditingObservacion ? 'Actualizar' : 'Guardar'" cancelText="Cancelar"
      :showAddAnother="!isEditingObservacion" v-model:addAnother="addAnotherObservacion"
      @confirm="handleObservacionSubmit" @cancel="handleObservacionCancel">
      <form v-if="observacionForm" @submit.prevent="handleObservacionSubmit" class="cuenta-form">
        <div class="form-grid-single">
          <GoogleInput v-model="observacionForm.autorTexto" label="Autor (opcional)"
            placeholder="Tu nombre de usuario o deja en blanco"
            :hint="`Usuarios disponibles: ${usuarioOptions.map(u => u.label).join(', ')}`" />
          <GoogleSelect v-model="observacionForm.taller" :options="observacionTallerOptions"
            label="Taller / canalización *" placeholder="Selecciona el tipo" required />
          <div class="field">
            <label for="obs-detalle">Detalle *</label>
            <textarea v-model="observacionForm.detalle" id="obs-detalle" class="form-textarea" rows="4"
              placeholder="Escribe la observación aquí..." required></textarea>
          </div>
        </div>
      </form>
    </GoogleModal>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';

import SectionCard from '../components/layout/sideCard.vue';
import GoogleButton from '../components/ui/button.vue';
import GoogleInput from '../components/ui/input.vue';
import GoogleSelect from '../components/ui/select.vue';
import GoogleModal from '../components/modal/modal.vue';
import AlumnosForm from '../components/formulario/AlumnosForm.vue';
import CarrerasManager from '../components/mantenimiento/CarrerasManager.vue';
import ConceptosManager from '../components/mantenimiento/ConceptosManager.vue';

import {
  getAlumnos,
  createAlumno,
  updateAlumno,
  deleteAlumno as deleteAlumnoAPI,
  type Alumno,
  type AlumnoCreate,
} from '../services/alumnos';
import {
  getCuentas,
  createCuenta,
  updateCuenta,
  deleteCuenta as deleteCuentaAPI,
  type Cuenta,
  type CuentaPayload,
} from '../services/cuentas';
import * as XLSX from 'xlsx';
import AlumnosBulkModal from '../components/modal/AlumnosBulkModal.vue';
import {
  getCiclosEscolares,
  createCicloEscolar,
  type CicloEscolar,
} from '../services/ciclos-escolares';
import {
  getCarreras,
  type Carrera,
} from '../services/carreras';
import {
  getMetodosPago,
  type MetodoPago,
} from '../services/metodo-pago';
import {
  getConceptos,
  type Concepto,
} from '../services/conceptos';
import {
  getObservaciones,
  createObservacion,
  updateObservacion,
  deleteObservacion as deleteObservacionAPI,
  type Observacion,
  type ObservacionPayload,
} from '../services/observaciones';
import { getUsuarios, type Usuario } from '../services/usuarios';


// ============= ESTADO =============
const alumnos = ref<Alumno[]>([]);
const cuentas = ref<Cuenta[]>([]);
const ciclosEscolares = ref<CicloEscolar[]>([]);
const carreras = ref<Carrera[]>([]);
const metodos = ref<MetodoPago[]>([]);
const observaciones = ref<Observacion[]>([]);
const usuarios = ref<Usuario[]>([]);
const conceptos = ref<Concepto[]>([]);


const loading = ref(false);
const loadingSave = ref(false);
const error = ref<string | null>(null);

const auth = useAuthStore();

// Filtros
const search = ref('');
const filterCarrera = ref<number | string>('');
const filterCiclo = ref<number | string>('');
const filterSemestre = ref<number | string>('');
const filterPago = ref('');

// Modales
const showDetailsModal = ref(false);
const showAlumnoModal = ref(false);
const showCuentaModal = ref(false);
const showCarrerasManager = ref(false);
const showConceptosManager = ref(false);
const showObservacionModal = ref(false);

// Datos seleccionados
const selectedMatricula = ref<string | null>(null);
const isEditingAlumno = ref(false);
const isEditingCuenta = ref(false);
const isEditingObservacion = ref(false);

// Formularios
const alumnoForm = ref<any | null>(null);
const cuentaForm = ref<Partial<CuentaPayload> & { id_cuenta?: number; fecha_pago: string | null } | null>(null);
const observacionForm = ref<Partial<ObservacionPayload> & { id_observacion?: number; autorTexto?: string } | null>(null);

// Agregar otro (estado para modales)
const addAnotherAlumno = ref(false);
const addAnotherCuenta = ref(false);
const addAnotherObservacion = ref(false);

// Carga masiva
const showBulkModal = ref(false);
const bulkFileName = ref('');
type BulkAdeudoInput = {
  concepto: string;
  monto?: number | null;
  id_ciclo?: number | null;
  pagado?: boolean;
  fecha_pago?: string | null;
  id_metodo?: number | null;
};

type BulkAlumnoRow = AlumnoCreate & {
  activo: boolean;
  adeudos: BulkAdeudoInput[];
  conceptos_display?: string;
};

const bulkRows = ref<BulkAlumnoRow[]>([]);
const bulkErrors = ref<string[]>([]);
const bulkParsing = ref(false);
const bulkLoading = ref(false);
const bulkProgress = ref({ processed: 0, total: 0 });


// ============= COMPUTED =============
const carreraOptions = computed(() => {
  const options = carreras.value.map((c) => ({
    value: c.id_carrera,
    label: c.nombre,
  }));

  const existingIds = new Set(options.map((opt) => Number(opt.value)));
  const fallbackIds = new Set(
    alumnos.value
      .map((alumno) => Number(alumno.id_carrera))
      .filter((id) => !Number.isNaN(id)),
  );

  fallbackIds.forEach((id) => {
    if (!existingIds.has(id)) {
      options.push({ value: id, label: `Plan #${id}` });
    }
  });

  return options;
});

const selectedCarreraLabel = computed(() => {
  if (filterCarrera.value === '' || filterCarrera.value === null) {
    return 'Todos los planes';
  }

  const selected = carreraOptions.value.find(
    (option) => Number(option.value) === Number(filterCarrera.value),
  );

  return selected?.label ?? `Plan #${filterCarrera.value}`;
});

const cicloOptions = computed(() =>
  ciclosEscolares.value.map((c) => ({
    value: c.id_ciclo,
    label: c.nombre,
  }))
);

const semestreOptions = computed(() => {
  const semestres = Array.from(
    new Set(
      alumnos.value
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

const metodoOptions = computed(() =>
  metodos.value.map((m) => ({
    value: m.id_metodo,
    label: m.nombre,
  }))
);

const conceptoOptions = computed(() =>
  conceptos.value.map((c) => ({
    value: c.clave,
    label: c.descripcion,
  }))
);

const defaultConcepto = computed(() => {
  const first = conceptoOptions.value[0]?.value;
  return first != null ? String(first) : '';
});

function getTakenConceptosForCuenta(matricula: string, idCiclo: number, excludeId?: number): Set<string> {
  const taken = new Set<string>();

  for (const cuenta of cuentas.value) {
    if (excludeId != null && cuenta.id_cuenta === excludeId) continue;
    if (String(cuenta.matricula).trim() !== matricula) continue;
    if (Number(cuenta.id_ciclo) !== Number(idCiclo)) continue;

    taken.add(String(cuenta.concepto).trim().toLowerCase());
  }

  return taken;
}

const availableConceptoOptionsForCuenta = computed(() => {
  if (!cuentaForm.value) return conceptoOptions.value;

  const matricula = String(cuentaForm.value.matricula ?? '').trim();
  const idCiclo = Number(cuentaForm.value.id_ciclo ?? 0);
  const excludeId = isEditingCuenta.value ? cuentaForm.value.id_cuenta : undefined;

  if (!matricula || !idCiclo) return conceptoOptions.value;

  const taken = getTakenConceptosForCuenta(matricula, idCiclo, excludeId);
  const currentConcept = String(cuentaForm.value.concepto ?? '').trim().toLowerCase();

  return conceptoOptions.value.filter((option) => {
    const value = String(option.value).trim().toLowerCase();
    return value === currentConcept || !taken.has(value);
  });
});

const cuentasByMatricula = computed(() => {
  const grouped = new Map<string, Cuenta[]>();

  for (const cuenta of cuentas.value) {
    const current = grouped.get(cuenta.matricula);
    if (current) {
      current.push(cuenta);
    } else {
      grouped.set(cuenta.matricula, [cuenta]);
    }
  }

  return grouped;
});

const usuarioOptions = computed(() =>
  usuarios.value.map((u) => ({
    value: u.id_usuario,
    label: u.username,
  }))
);

const observacionTallerOptions = [
  { value: 'canalización académica', label: 'Canalización académica' },
  { value: 'canalización psicológica', label: 'Canalización psicológica' },
  { value: 'baja', label: 'Baja' },
  { value: 'otro', label: 'Otro' },
];

function normalizeObservacionTaller(value: unknown): string {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized === 'canalizacion academica') return 'canalización académica';
  if (normalized === 'canalizacion psicologica') return 'canalización psicológica';
  if (normalized === 'baja') return 'baja';
  if (normalized === 'otro') return 'otro';
  return 'otro';
}

function formatObservacionTaller(value: unknown): string {
  const normalized = normalizeObservacionTaller(value);
  const found = observacionTallerOptions.find((option) => option.value === normalized);
  return found?.label ?? 'Otro';
}

function toComparableId(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

// Data principal: combina alumnos, ciclos y cuentas
const dashboardData = computed(() => {
  const cicloActual = ciclosEscolares.value.find((c) => c.es_actual);

  return alumnos.value.map((alumno) => {
    const carrera = carreras.value.find(
      (c) => c.id_carrera === alumno.id_carrera
    );
    const alumnosCuentas = cuentasByMatricula.value.get(alumno.matricula) ?? [];
    const cuentasPendientes = alumnosCuentas.filter((c) => !c.pagado).length;
    const totalPendiente = alumnosCuentas
      .filter((c) => !c.pagado)
      .reduce((sum, c) => sum + Number(c.monto), 0);

    return {
      alumno,
      matricula: alumno.matricula,
      nombre_completo: alumno.nombre_completo,
      carrera: carrera?.nombre || '-',
      duracionCarrera: carrera?.duracion_semestres || 0,
      semestre_actual: alumno.semestre_actual || 0,
      cicloActual: cicloActual?.nombre || '-',
      cuentasPendientes,
      totalPendiente,
    };
  });
});

// Data filtrada
const filteredData = computed(() => {
  return dashboardData.value.filter((row) => {
    const matchSearch =
      !search.value ||
      row.matricula.toLowerCase().includes(search.value.toLowerCase()) ||
      row.nombre_completo
        .toLowerCase()
        .includes(search.value.toLowerCase()) ||
      row.carrera
        .toLowerCase()
        .includes(search.value.toLowerCase());

    const matchCarrera =
      !filterCarrera.value ||
      toComparableId(row.alumno.id_carrera) === toComparableId(filterCarrera.value);

    const matchCiclo =
      !filterCiclo.value ||
      ciclosEscolares.value
        .find((c) => toComparableId(c.id_ciclo) === toComparableId(filterCiclo.value))
        ?.nombre === row.cicloActual;

    const matchSemestre =
      !filterSemestre.value ||
      Number(row.semestre_actual) === Number(filterSemestre.value);

    const matchPago =
      !filterPago.value ||
      (filterPago.value === 'pendiente' && row.totalPendiente > 0) ||
      (filterPago.value === 'pagado' && row.totalPendiente === 0);

    return matchSearch && matchCarrera && matchCiclo && matchSemestre && matchPago;
  });
});

const totalPendiente = computed(() =>
  dashboardData.value.reduce((sum, row) => sum + row.totalPendiente, 0)
);

const selectedRowComputed = computed(() => {
  if (!selectedMatricula.value) return null;
  return dashboardData.value.find((row) => row.matricula === selectedMatricula.value) || null;
});

const selectedRowCuentas = computed(() => {
  if (!selectedMatricula.value) return [];
  return cuentas.value.filter(
    (c) => c.matricula === selectedMatricula.value
  );
});

const selectedRowObservaciones = computed(() => {
  if (!selectedMatricula.value) return [];
  return observaciones.value
    .filter((o) => o.matricula === selectedMatricula.value)
    .sort((a, b) => new Date(b.fecha ?? 0).getTime() - new Date(a.fecha ?? 0).getTime());
});


// ============= MÉTODOS =============
async function checkAndCreateCiclo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  let nombre = '';
  let fecha_inicio = '';
  let fecha_fin = '';

  if (month >= 1 && month <= 6) {
    nombre = `Ene-Jun ${year}`;
    fecha_inicio = `${year}-01-01`;
    fecha_fin = `${year}-06-30`;
  } else {
    nombre = `Ago-Dic ${year}`;
    fecha_inicio = `${year}-08-01`;
    fecha_fin = `${year}-12-31`;
  }

  const existe = ciclosEscolares.value.some((c) => c.nombre === nombre);

  if (!existe) {
    try {
      console.log(`El ciclo "${nombre}" no existe. Creando...`);
      // Marcarlo como actual solo si no hay otro ciclo actual
      const hayCicloActual = ciclosEscolares.value.some(c => c.es_actual);

      const nuevoCiclo = await createCicloEscolar({
        nombre,
        fecha_inicio,
        fecha_fin,
        es_actual: !hayCicloActual,
      });
      ciclosEscolares.value.push(nuevoCiclo);
      console.log(`Ciclo "${nombre}" creado exitosamente.`);
    } catch (err) {
      console.error(`Error al crear el ciclo "${nombre}":`, err);
      error.value = `Fallo al intentar crear el ciclo automático: ${nombre}`;
    }
  } else {
    // Ciclo ya existe, no es necesario loguear cada vez
  }
}

async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    // 1. Cargar ciclos primero
    const ciclosData = await getCiclosEscolares();
    ciclosEscolares.value = ciclosData;

    // 2. Verificar y crear el ciclo si es necesario
    await checkAndCreateCiclo();

    // 3. Cargar el resto de los datos en paralelo, sin romper toda la vista
    // si un endpoint viene con permisos restringidos.
    const [
      alumnosResult,
      cuentasResult,
      carrerasResult,
      metodosResult,
      observacionesResult,
      usuariosResult,
      conceptosResult,
    ] = await Promise.allSettled([
      getAlumnos(),
      getCuentas(),
      getCarreras(),
      getMetodosPago(),
      getObservaciones(),
      getUsuarios(),
      getConceptos(),
    ]);

    const failedLoads: string[] = [];

    if (alumnosResult.status === 'fulfilled') {
      alumnos.value = alumnosResult.value;
    } else {
      failedLoads.push('alumnos');
    }

    if (cuentasResult.status === 'fulfilled') {
      cuentas.value = cuentasResult.value;
    } else {
      failedLoads.push('cuentas');
    }

    if (carrerasResult.status === 'fulfilled') {
      carreras.value = carrerasResult.value;
    } else {
      failedLoads.push('planes de estudio');
    }

    if (metodosResult.status === 'fulfilled') {
      metodos.value = metodosResult.value;
    } else {
      failedLoads.push('metodos de pago');
    }

    if (observacionesResult.status === 'fulfilled') {
      observaciones.value = observacionesResult.value;
    } else {
      failedLoads.push('observaciones');
    }

    if (usuariosResult.status === 'fulfilled') {
      usuarios.value = usuariosResult.value;
    } else {
      failedLoads.push('usuarios');
    }

    if (conceptosResult.status === 'fulfilled') {
      conceptos.value = conceptosResult.value;
    } else {
      failedLoads.push('conceptos');
    }

    if (failedLoads.length > 0) {
      error.value = `No se pudieron cargar algunos datos: ${failedLoads.join(', ')}`;
    }

  } catch (err) {
    error.value = 'Error al cargar los datos';
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

function getCicloNombre(id_ciclo: number): string {
  return ciclosEscolares.value.find((c) => c.id_ciclo === id_ciclo)?.nombre || '-';
}

function getUsuarioNombre(id_autor: number | null): string {
  if (!id_autor) return 'Sistema';

  const found = usuarios.value.find((u) => u.id_usuario === id_autor)?.username;
  if (found) return found;

  const currentUserId = Number(auth.user?.id_usuario ?? 0);
  if (!Number.isNaN(currentUserId) && currentUserId === Number(id_autor)) {
    return String(auth.user?.username ?? 'Sistema');
  }

  return '-';
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
}

function getCurrentUserId(): number | null {
  const parsed = Number(auth.user?.id_usuario ?? 0);
  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
}

function getCurrentUsername(): string {
  return String(auth.user?.username ?? '').trim();
}

function isConceptConstraintError(err: unknown): boolean {
  const data = (err as any)?.response?.data;
  const code = String(data?.code ?? '');
  const message = String(data?.message ?? '').toLowerCase();
  return code === '23514' && message.includes('cuentas_por_cobrar_concepto_check');
}

function isDuplicateCuentaError(err: unknown): boolean {
  const data = (err as any)?.response?.data;
  const code = String(data?.code ?? '');
  const message = String(data?.message ?? '').toLowerCase();

  return (
    code === '23505' &&
    (message.includes('idx_cxc_matricula_concepto_ciclo') ||
      message.includes('llave duplicada'))
  );
}

function getApiErrorMessage(err: unknown): string {
  const data = (err as any)?.response?.data;
  if (data?.message) return String(data.message);
  if (err instanceof Error) return err.message;
  return 'Error inesperado';
}

function isSameCuentaKey(cuenta: Cuenta, payload: CuentaPayload): boolean {
  return (
    String(cuenta.matricula).trim() === String(payload.matricula).trim() &&
    String(cuenta.concepto).trim().toLowerCase() === String(payload.concepto).trim().toLowerCase() &&
    Number(cuenta.id_ciclo) === Number(payload.id_ciclo)
  );
}

function findDuplicateCuenta(payload: CuentaPayload, excludeId?: number): Cuenta | undefined {
  return cuentas.value.find((cuenta) => {
    if (excludeId != null && cuenta.id_cuenta === excludeId) return false;
    return isSameCuentaKey(cuenta, payload);
  });
}

// ============= ALUMNO CRUD =============
function getDefaultCicloId(): number | null {
  const ciclo = ciclosEscolares.value.find((c) => c.es_actual) ?? ciclosEscolares.value[0];
  if (!ciclo) return null;
  const id = Number(ciclo.id_ciclo);
  return Number.isNaN(id) ? null : id;
}

function getConceptoFromValue(value: unknown): Concepto | undefined {
  const normalized = String(value ?? '').trim();
  if (!normalized) return undefined;
  return conceptos.value.find((c) => c.clave === normalized || c.descripcion === normalized);
}

function buildDefaultAdeudoForm() {
  const concepto = conceptos.value[0];

  return {
    concepto: concepto?.clave ?? '',
    monto: Number(concepto?.monto_default ?? 0),
    pagado: false,
    id_ciclo: getDefaultCicloId(),
    fecha_pago: null,
    id_metodo: null,
  };
}

function openCreateAlumno() {
  isEditingAlumno.value = false;
  alumnoForm.value = {
    matricula: '',
    nombre_completo: '',
    email_institucional: '',
    telefono_contacto: '',
    id_carrera: null as any,
    semestre_actual: 1,
    activo: true,
    // Inicialización para adeudo
    con_adeudo: true,
    adeudos: [buildDefaultAdeudoForm()]
  };
  showAlumnoModal.value = true;
}

function editAlumno(alumno: Alumno) {
  isEditingAlumno.value = true;
  alumnoForm.value = {
    matricula: alumno.matricula,
    nombre_completo: alumno.nombre_completo,
    email_institucional: alumno.email_institucional ?? '',
    telefono_contacto: alumno.telefono_contacto ?? '',
    id_carrera: alumno.id_carrera,
    semestre_actual: alumno.semestre_actual,
    activo: alumno.activo,
  };
  showAlumnoModal.value = true;
}

async function handleAlumnoSubmit() {
  if (!alumnoForm.value) return;
  loadingSave.value = true;
  try {
    if (isEditingAlumno.value) {
      const { matricula, con_adeudo, adeudos, ...payload } = alumnoForm.value;
      await updateAlumno(matricula, payload);
    } else {
      const { con_adeudo, adeudos, ...createPayload } = alumnoForm.value;
      // 1. Crear el alumno
      const createdAlumno = await createAlumno(createPayload as AlumnoCreate);
      const matriculaTarget = String(createdAlumno.matricula || alumnoForm.value.matricula || '').trim();

      // 2. Crear adeudos iniciales (si se capturaron uno o más conceptos)
      const adeudosList = Array.isArray(adeudos)
        ? adeudos.filter((adeudo) => !!adeudo?.concepto)
        : [];

      if (adeudosList.length > 0) {
        const cicloActualId = getDefaultCicloId();
        const seenKeys = new Set<string>();

        if (!matriculaTarget) {
          throw new Error('No se obtuvo matrícula válida para vincular cuentas por cobrar.');
        }

        for (const adeudo of adeudosList) {
          const conceptoInfo = getConceptoFromValue(adeudo.concepto);
          if (!conceptoInfo) {
            throw new Error(`Concepto inválido: ${String(adeudo.concepto)}`);
          }

          const idCiclo = Number(adeudo.id_ciclo ?? cicloActualId);
          if (!idCiclo || Number.isNaN(idCiclo)) {
            throw new Error(`No se pudo determinar el ciclo para el concepto ${conceptoInfo.clave}`);
          }

          const uniqueKey = `${matriculaTarget}|${conceptoInfo.clave}|${idCiclo}`;
          if (seenKeys.has(uniqueKey)) {
            throw new Error(`Concepto duplicado en adeudos iniciales: ${conceptoInfo.clave} (${getCicloNombre(idCiclo)}).`);
          }
          seenKeys.add(uniqueKey);

          const montoParsed = Number(adeudo.monto);
          const montoFinal = Number.isNaN(montoParsed)
            ? Number(conceptoInfo.monto_default ?? 0)
            : montoParsed;

          const cuentaPayload: CuentaPayload = {
            matricula: matriculaTarget,
            concepto: conceptoInfo.clave,
            id_ciclo: idCiclo,
            monto: montoFinal,
            pagado: adeudo.pagado || false,
            fecha_pago: adeudo.pagado ? adeudo.fecha_pago : null,
            id_metodo: adeudo.pagado ? adeudo.id_metodo : null,
          };
          await createCuenta(cuentaPayload);
        }
      }
    }

    if (addAnotherAlumno.value && !isEditingAlumno.value) {
      // Quedarse abierto y resetear para el siguiente alumno
      openCreateAlumno();
    } else {
      showAlumnoModal.value = false;
    }

    await loadData();
  } catch (err) {
    if (isConceptConstraintError(err)) {
      error.value = 'El backend solo acepta conceptos permitidos por su restriccion actual (cuentas_por_cobrar_concepto_check). Actualiza esa regla en backend/BD o usa un concepto valido legacy.';
      console.error(err);
      return;
    }

    if (isDuplicateCuentaError(err)) {
      error.value = 'Ya existe una cuenta con la misma matricula, concepto y ciclo. Evita repetir conceptos iguales dentro del mismo ciclo.';
      console.error(err);
      return;
    }

    const fallbackError = isEditingAlumno.value
      ? 'Error al actualizar alumno'
      : 'Error al crear alumno con cuentas por cobrar iniciales';

    const apiMessage = getApiErrorMessage(err);
    error.value = apiMessage
      ? `${fallbackError}: ${apiMessage}`
      : fallbackError;
    console.error(err);
  } finally {
    loadingSave.value = false;
  }
}

function handleAlumnoCancel() {
  alumnoForm.value = null;
  showAlumnoModal.value = false;
}

async function deleteAlumno(matricula: string) {
  if (!confirm(`¿Eliminar alumno ${matricula}?`)) return;
  try {
    await deleteAlumnoAPI(matricula);
    await loadData();
  } catch (err) {
    error.value = 'Error al eliminar alumno';
    console.error(err);
  }
}

// ============= CUENTA CRUD =============
function syncCuentaConceptoSelection() {
  if (!cuentaForm.value) return;

  const current = String(cuentaForm.value.concepto ?? '').trim();
  const exists = availableConceptoOptionsForCuenta.value.some(
    (option) => String(option.value).trim() === current,
  );

  if (exists) return;

  const fallback = availableConceptoOptionsForCuenta.value[0];
  if (!fallback) {
    cuentaForm.value.concepto = '';
    cuentaForm.value.monto = 0;
    return;
  }

  cuentaForm.value.concepto = String(fallback.value);
  onConceptoDashboardChange(fallback.value as string);
}

function onConceptoDashboardChange(val: string | number | null) {
  if (val === null || !cuentaForm.value) return;
  const concepto = conceptos.value.find((c) => c.clave === String(val));
  if (concepto) {
    cuentaForm.value.monto = Number(concepto.monto_default ?? 0);
  }
}

function openNewCuenta(matricula: string) {
  isEditingCuenta.value = false;

  const defaultCicloId = getDefaultCicloId();
  const taken = defaultCicloId
    ? getTakenConceptosForCuenta(String(matricula).trim(), defaultCicloId)
    : new Set<string>();

  const conceptoDisponible = conceptos.value.find(
    (c) => !taken.has(String(c.clave).trim().toLowerCase()),
  );

  const conceptoDefault = conceptoDisponible?.clave ?? defaultConcepto.value;
  const concepto = conceptos.value.find((c) => c.clave === conceptoDefault);

  cuentaForm.value = {
    matricula,
    concepto: conceptoDefault,
    id_ciclo: defaultCicloId ?? undefined,
    monto: concepto?.monto_default ?? 0,
    pagado: false,
    fecha_pago: null,
    id_metodo: null,
  };

  syncCuentaConceptoSelection();
  showCuentaModal.value = true;
}

function openNewCuentaFromDetails(matricula: string) {
  openNewCuenta(matricula);
}

function openDetails(row: any) {
  selectedMatricula.value = row.matricula;
  showDetailsModal.value = true;
}

function editCuenta(cuenta: Cuenta) {
  isEditingCuenta.value = true;
  cuentaForm.value = {
    id_cuenta: cuenta.id_cuenta,
    matricula: cuenta.matricula,
    concepto: cuenta.concepto,
    id_ciclo: cuenta.id_ciclo,
    monto: cuenta.monto,
    pagado: cuenta.pagado,
    fecha_pago: cuenta.fecha_pago,
    id_metodo: cuenta.id_metodo,
  };
  syncCuentaConceptoSelection();
  showCuentaModal.value = true;
}

async function handleCuentaSubmit() {
  if (!cuentaForm.value) return;
  loadingSave.value = true;
  try {
    const payload: CuentaPayload = {
      matricula: cuentaForm.value.matricula!,
      concepto: cuentaForm.value.concepto as any,
      id_ciclo: cuentaForm.value.id_ciclo as number,
      monto: cuentaForm.value.monto as number,
      pagado: cuentaForm.value.pagado!,
      fecha_pago: cuentaForm.value.pagado ? cuentaForm.value.fecha_pago : null,
      id_metodo: cuentaForm.value.pagado ? cuentaForm.value.id_metodo : null,
    };

    if (!payload.concepto || !payload.id_ciclo) {
      error.value = 'Debes seleccionar concepto y ciclo escolar antes de guardar la cuenta.';
      return;
    }

    const duplicate = findDuplicateCuenta(
      payload,
      isEditingCuenta.value ? cuentaForm.value.id_cuenta : undefined,
    );

    if (duplicate) {
      error.value = `Ya existe la cuenta #${duplicate.id_cuenta} para ${payload.matricula}, ${payload.concepto} y ciclo ${getCicloNombre(payload.id_ciclo)}.`;
      return;
    }

    if (isEditingCuenta.value && cuentaForm.value.id_cuenta) {
      await updateCuenta(cuentaForm.value.id_cuenta, payload);
    } else {
      await createCuenta(payload);
    }

    if (addAnotherCuenta.value && !isEditingCuenta.value) {
      // Quedarse abierto y resetear (manteniendo la misma matrícula)
      openNewCuenta(payload.matricula);
    } else {
      showCuentaModal.value = false;
    }

    await loadData();
  } catch (err) {
    if (isConceptConstraintError(err)) {
      error.value = 'El backend rechazo el concepto por la restriccion cuentas_por_cobrar_concepto_check. Revisa conceptos permitidos en BD.';
      console.error(err);
      return;
    }

    if (isDuplicateCuentaError(err)) {
      error.value = 'Cuenta duplicada: ya existe una cuenta con la misma matricula, concepto y ciclo.';
      console.error(err);
      return;
    }

    error.value = isEditingCuenta.value
      ? `Error al actualizar cuenta: ${getApiErrorMessage(err)}`
      : `Error al crear cuenta: ${getApiErrorMessage(err)}`;
    console.error(err);
  } finally {
    loadingSave.value = false;
  }
}

function handleCuentaCancel() {
  cuentaForm.value = null;
  showCuentaModal.value = false;
}

async function deleteCuenta(id_cuenta: number) {
  if (!confirm(`¿Eliminar cuenta #${id_cuenta}?`)) return;
  try {
    await deleteCuentaAPI(id_cuenta);
    await loadData();
  } catch (err) {
    error.value = 'Error al eliminar cuenta';
    console.error(err);
  }
}

// ============= OBSERVACION CRUD =============
function openNewObservacion(matricula: string) {
  isEditingObservacion.value = false;
  const username = getCurrentUsername();

  observacionForm.value = {
    matricula: matricula,
    detalle: '',
    taller: 'otro',
    autorTexto: username, // login actual por defecto
  };
  showObservacionModal.value = true;
}

function editObservacion(obs: Observacion) {
  isEditingObservacion.value = true;
  observacionForm.value = {
    id_observacion: obs.id_observacion,
    matricula: obs.matricula,
    detalle: obs.detalle,
    taller: normalizeObservacionTaller(obs.taller),
    autorTexto: getUsuarioNombre(obs.id_autor ?? null),
  };
  showObservacionModal.value = true;
}

async function handleObservacionSubmit() {
  if (!observacionForm.value) return;
  loadingSave.value = true;

  try {
    // Intentar matchear el texto con un usuario existente
    const autorTexto = observacionForm.value.autorTexto?.trim() ?? '';
    const currentUserId = getCurrentUserId();
    const currentUsername = getCurrentUsername().toLowerCase();
    let autorId: number | null = null;

    if (autorTexto) {
      const foundUser = usuarios.value.find(u => u.username.toLowerCase() === autorTexto.toLowerCase());
      if (foundUser) {
        autorId = foundUser.id_usuario;
      } else if (currentUserId && autorTexto.toLowerCase() === currentUsername) {
        autorId = currentUserId;
      }
    } else {
      autorId = currentUserId;
    }

    const payload: ObservacionPayload = {
      matricula: observacionForm.value.matricula!,
      detalle: observacionForm.value.detalle!,
      taller: normalizeObservacionTaller(observacionForm.value.taller),
      id_autor: autorId,
    };

    if (isEditingObservacion.value && observacionForm.value.id_observacion) {
      await updateObservacion(observacionForm.value.id_observacion, payload);
    } else {
      await createObservacion(payload);
    }

    if (addAnotherObservacion.value && !isEditingObservacion.value) {
      // Quedarse abierto y resetear
      openNewObservacion(payload.matricula);
    } else {
      showObservacionModal.value = false;
    }

    await loadData(); // Recargar todo para reflejar cambios
  } catch (err) {
    error.value = isEditingObservacion.value ? 'Error al actualizar observación' : 'Error al crear observación';
    console.error(err);
  } finally {
    loadingSave.value = false;
  }
}

function handleObservacionCancel() {
  observacionForm.value = null;
  showObservacionModal.value = false;
}

async function deleteObservacion(id_observacion: number) {
  if (!confirm(`¿Eliminar observación #${id_observacion}?`)) return;
  try {
    await deleteObservacionAPI(id_observacion);
    await loadData();
  } catch (err) {
    error.value = 'Error al eliminar observación';
    console.error(err);
  }
}

// ============= EXCEL LOGIC =============
function parseBooleanFlag(value: unknown, defaultValue: boolean): boolean {
  if (value === null || value === undefined || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return defaultValue;

  return ['1', 'true', 'si', 'sí', 'yes', 'y', 'x'].includes(normalized);
}

function parseOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function splitConceptTokens(raw: unknown): string[] {
  if (raw === null || raw === undefined || raw === '') return [];

  return String(raw)
    .split(/[|,;]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function parseAdeudosFromRow(row: Record<string, unknown>): BulkAdeudoInput[] {
  const inlineConcepts = splitConceptTokens(
    row.conceptos ?? row.concepto ?? row.adeudos ?? row.conceptos_clave,
  );

  const indexedConcepts = Object.entries(row)
    .filter(([key]) => /^concepto_\d+$/i.test(key))
    .sort(([a], [b]) => a.localeCompare(b, 'es', { numeric: true }))
    .flatMap(([, value]) => splitConceptTokens(value));

  const conceptos = Array.from(new Set([...inlineConcepts, ...indexedConcepts]));

  const commonCiclo = parseOptionalNumber(row.id_ciclo_adeudo ?? row.id_ciclo_cuenta ?? row.id_ciclo);
  const commonMonto = parseOptionalNumber(row.monto_adeudo ?? row.monto_cuenta);
  const commonMetodo = parseOptionalNumber(row.id_metodo_adeudo ?? row.id_metodo_cuenta);
  const commonPagado = parseBooleanFlag(row.pagado_adeudo ?? row.pagado_cuenta, false);

  const rawFecha = row.fecha_pago_adeudo ?? row.fecha_pago_cuenta;
  const commonFechaPago =
    rawFecha === null || rawFecha === undefined || rawFecha === '' ? null : String(rawFecha).trim();

  return conceptos.map((concepto) => ({
    concepto,
    id_ciclo: commonCiclo,
    monto: commonMonto,
    pagado: commonPagado,
    fecha_pago: commonFechaPago,
    id_metodo: commonMetodo,
  }));
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function findConceptoByToken(token: string): Concepto | undefined {
  const normalizedToken = normalizeText(token);

  return conceptos.value.find((concepto) => {
    return (
      normalizeText(concepto.clave) === normalizedToken ||
      normalizeText(concepto.descripcion) === normalizedToken
    );
  });
}

function downloadTemplate() {
  const headers = [
    'matricula',
    'nombre_completo',
    'email_institucional',
    'telefono_contacto',
    'id_carrera',
    'semestre_actual',
    'activo',
    'conceptos',
    'id_ciclo_adeudo',
    'pagado_adeudo',
  ];
  const cicloActual = ciclosEscolares.value.find((c) => c.es_actual)?.id_ciclo ?? '';
  const sample = [
    ['190123', 'JUAN PÉREZ GARCÍA', 'juan.perez@uadec.edu.mx', '8711112233', 1, 1, 1, 'INSCRIPCION|CREDENCIAL', cicloActual, 0],
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Alumnos');
  XLSX.writeFile(wb, 'plantilla_alumnos.xlsx');
}

function onBulkFileChange(event: any) {
  const file = event.target.files[0];
  if (!file) return;
  bulkFileName.value = file.name;
  bulkParsing.value = true;
  bulkRows.value = [];
  bulkErrors.value = [];

  const reader = new FileReader();
  reader.onload = (e: any) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error('El archivo Excel no tiene hojas.');
      const sheet = workbook.Sheets[firstSheetName];
      if (!sheet) throw new Error('No se pudo encontrar la hoja especificada.');
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

      // Mapeo de alumno + adeudos iniciales (opcional)
      bulkRows.value = json.map(row => {
        const adeudos = parseAdeudosFromRow(row);

        return {
          matricula: String(row.matricula || ''),
          nombre_completo: String(row.nombre_completo || ''),
          email_institucional: String(row.email_institucional || ''),
          telefono_contacto: String(row.telefono_contacto || ''),
          id_carrera: Number(row.id_carrera || 1),
          semestre_actual: Number(row.semestre_actual || 1),
          activo: parseBooleanFlag(row.activo, true),
          adeudos,
          conceptos_display: adeudos
            .map((adeudo) => adeudo.concepto)
            .join(' | '),
        };
      });
    } catch (err) {
      bulkErrors.value.push('Error al leer el archivo Excel.');
      console.error(err);
    } finally {
      bulkParsing.value = false;
    }
  };
  reader.readAsArrayBuffer(file);
}

async function handleBulkUpload() {
  if (!bulkRows.value.length) return;
  bulkLoading.value = true;
  bulkProgress.value = { processed: 0, total: bulkRows.value.length };

  const cicloActualId = ciclosEscolares.value.find((c) => c.es_actual)?.id_ciclo ?? ciclosEscolares.value[0]?.id_ciclo;

  for (const row of bulkRows.value) {
    try {
      const alumnoPayload: AlumnoCreate = {
        matricula: row.matricula,
        nombre_completo: row.nombre_completo,
        email_institucional: row.email_institucional,
        telefono_contacto: row.telefono_contacto,
        id_carrera: Number(row.id_carrera),
        semestre_actual: Number(row.semestre_actual),
        activo: row.activo,
      };

      await createAlumno(alumnoPayload);

      for (const adeudo of row.adeudos) {
        const concepto = findConceptoByToken(adeudo.concepto);
        if (!concepto) {
          bulkErrors.value.push(
            `Matrícula ${row.matricula}: concepto "${adeudo.concepto}" no existe en catálogo.`,
          );
          continue;
        }

        const idCiclo = adeudo.id_ciclo ?? cicloActualId;
        if (!idCiclo) {
          bulkErrors.value.push(
            `Matrícula ${row.matricula}: no hay ciclo escolar para crear adeudo de "${concepto.clave}".`,
          );
          continue;
        }

        const pagado = Boolean(adeudo.pagado);
        const cuentaPayload: CuentaPayload = {
          matricula: row.matricula,
          concepto: concepto.clave,
          id_ciclo: Number(idCiclo),
          monto: Number(adeudo.monto ?? concepto.monto_default ?? 0),
          pagado,
          fecha_pago: pagado ? (adeudo.fecha_pago ?? new Date().toISOString().slice(0, 10)) : null,
          id_metodo: pagado ? (adeudo.id_metodo ?? null) : null,
        };

        await createCuenta(cuentaPayload);
      }

      bulkProgress.value.processed++;
    } catch (err: any) {
      bulkErrors.value.push(`Error en matrícula ${row.matricula}: ${err.message || 'Fallo desconocido'}`);
    }
  }

  bulkLoading.value = false;
  if (bulkErrors.value.length === 0) {
    showBulkModal.value = false;
    bulkRows.value = [];
    bulkFileName.value = '';
    alert('Carga masiva completada con éxito.');
  }
  await loadData();
}

// ============= ANIMATIONS =============
function animateEntrance() {
  const tableRows = document.querySelectorAll('.table tbody tr');
  const chips = document.querySelectorAll('.chip');

  if (!tableRows.length && !chips.length) return;

  import('animejs').then(({ animate }) => {
    // Staggered rows
    if (tableRows.length) {
      animate('.table tbody tr', {
        opacity: [0, 1],
        translateX: [-10, 0],
        delay: (_el: any, i: number) => i * 30,
        duration: 600,
        easing: 'easeOutQuad'
      });
    }

    // Chips entrance
    if (chips.length) {
      animate('.chip', {
        scale: [0.8, 1],
        opacity: [0, 1],
        delay: (_el: any, i: number) => 300 + (i * 50),
        duration: 500,
        easing: 'easeOutElastic(1, .8)'
      });
    }
  });
}

// ============= HOOKS =============
onMounted(() => {
  if (!auth.can('filters.carrera.change') && auth.userCareerId) {
    filterCarrera.value = Number(auth.userCareerId);
  }
  loadData().then(() => {
    // Dar un poco más de tiempo para que el DOM se renderice tras la carga de datos
    setTimeout(animateEntrance, 200);
  });
});

watch(
  [
    () => cuentaForm.value?.matricula,
    () => cuentaForm.value?.id_ciclo,
    () => cuentaForm.value?.concepto,
    () => conceptos.value.length,
  ],
  () => {
    if (!cuentaForm.value) return;
    syncCuentaConceptoSelection();
  },
);

// Vigilar cambios en el id_carrera del usuario (por si acaso)
watch(() => auth.userCareerId, (newVal) => {
  if (!auth.can('filters.carrera.change') && newVal) {
    filterCarrera.value = Number(newVal);
  }
});
</script>

<style scoped>
.g-page-animate {
  animation: g-fade-in 180ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes g-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.back-to-home {
  margin-bottom: 0.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e8eaed;
}

.page-title {
  font-size: 2rem;
  font-weight: 500;
  letter-spacing: -0.015em;
  color: #202124;
  margin: 0;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #5f6368;
  margin: 0.5rem 0 0 0;
  font-weight: 400;
}

.page-header-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.chip-soft {
  background-color: #f1f3f4;
  color: #202124;
}

.table-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.table-search-input {
  flex: 1;
  min-width: 220px;
}

.table-filter-select {
  min-width: 160px;
}

.alumno-modal-shell {
  border: 1px solid #e3edf9;
  border-radius: 16px;
  padding: 1rem 1.1rem;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 26%);
}

.alumno-modal-shell :deep(.g-form-header) {
  border-bottom: 1px solid #e8eaed;
  padding-bottom: 0.75rem;
  margin-bottom: 0.25rem;
}

.alumno-modal-shell :deep(.g-form-title) {
  font-size: 1.08rem;
  font-weight: 600;
  color: #202124;
}

.alumno-modal-shell :deep(.g-form-subtitle) {
  color: #5f6368;
}

.alumno-modal-shell :deep(.g-form-grid) {
  gap: 1rem 1.1rem;
  padding: 0;
}

.alumno-modal-shell :deep(.g-form-actions) {
  border-top: 1px solid #e8eaed;
  padding-top: 0.9rem;
  margin-top: 0.8rem;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.12);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  background: #ffffff;
}

.table thead {
  background: #f8f9fa;
  border-bottom: 1px solid #dadce0;
}

.table th {
  padding: 1rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #202124;
  letter-spacing: 0.3px;
  font-size: 0.8125rem;
}

.table tbody tr {
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.table tbody tr:hover {
  background-color: #f8f9fa;
}

.table tbody tr.row-has-debt {
  background-color: #fffbf0;
}

.table td {
  padding: 1rem 0.75rem;
  vertical-align: middle;
}

.cell-matricula {
  font-weight: 600;
  color: #1a73e8;
}

.cell-name {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.cell-subtle-plan {
  font-size: 0.75rem;
  color: #5f6368;
}

.cell-centered {
  text-align: center;
}

.cell-money {
  text-align: right;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.cell-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  white-space: nowrap;
}

.icon-button {
  width: 34px;
  height: 34px;
  border: 1px solid #d6dbe3;
  background: #ffffff;
  color: #5f6368;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0;
  border-radius: 10px;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.icon-button .material-symbols-outlined {
  font-size: 1.16rem;
}

.icon-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(60, 64, 67, 0.16);
}

.icon-button:active {
  transform: translateY(0);
}

.action-view {
  color: #1a73e8;
  background: #eef4ff;
  border-color: #c8dcff;
}

.action-edit {
  color: #174ea6;
  background: #e8f0fe;
  border-color: #c6dafc;
}

.action-payments {
  color: #0b8043;
  background: #e9f7ef;
  border-color: #c8e6d6;
}

.action-delete {
  color: #d93025;
  background: #fdeceb;
  border-color: #f6c8c4;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  margin-left: 0.5rem;
}

.badge-danger {
  background-color: #fce8e6;
  color: #d32f2f;
}

.badge-success {
  background-color: #e6f4ea;
  color: #137333;
}

.chip-info {
  background-color: #e3f2fd;
  color: #1565c0;
}

.chip-success {
  background-color: #e6f4ea;
  color: #137333;
}

.chip-warning {
  background-color: #fef2c7;
  color: #8a6100;
}

.chip-danger {
  background-color: #fee2e2;
  color: #b42318;
}

.chip-muted {
  background-color: #f1f3f4;
  color: #5f6368;
}

.text-danger {
  color: #d32f2f;
}

.text-success {
  color: #137333;
}

.error {
  padding: 1rem;
  background-color: #fce8e6;
  border-left: 4px solid #d32f2f;
  color: #d32f2f;
  border-radius: 8px;
  margin: 0;
  font-size: 0.875rem;
}

.empty {
  text-align: center;
  padding: 3rem 2rem;
  color: #5f6368;
  margin: 0;
  font-size: 0.95rem;
}

/* Detalles Modal enhancements */
.details-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
  max-height: 100%;
}

.status-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.75rem;
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.status-banner-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-icon {
  font-size: 2.5rem;
  opacity: 0.9;
}

.status-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.status-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.status-amount {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
}

.banner-danger {
  background: linear-gradient(135deg, #d32f2f, #e53935);
}

.banner-success {
  background: linear-gradient(135deg, #2e7d32, #43a047);
}

.details-section {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  background-color: #ffffff;
  transition: box-shadow 0.2s;
}

.details-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.highlight-section {
  border: 2px solid #e8f0fe;
  background-color: #fafbfc;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  gap: 1rem;
}

.details-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #202124;
  padding-bottom: 0px;
  border-bottom: none;
  letter-spacing: 0.3px;
}

.section-icon {
  color: #1a73e8;
  font-size: 1.3rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  background: #f8f9fa;
  padding: 1.25rem;
  border-radius: 8px;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.detail-field label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #80868b;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.detail-field p {
  margin: 0;
  color: #202124;
  word-break: break-word;
  font-size: 0.95rem;
}

.font-medium {
  font-weight: 500;
}

.font-numeric {
  font-variant-numeric: tabular-nums;
}

.text-muted {
  color: #5f6368;
}

.text-small {
  font-size: 0.8rem;
}

.empty-state-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  color: #5f6368;
  text-align: center;
  gap: 0.5rem;
}

.empty-icon {
  font-size: 2rem;
  color: #dadce0;
}

.cuentas-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.cuentas-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  background: white;
}

.cuentas-table thead {
  background: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
}

.cuentas-table th {
  padding: 0.85rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #3c4043;
  font-size: 0.8125rem;
  letter-spacing: 0.3px;
}

.cuentas-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.cuentas-table tbody tr:last-child td {
  border-bottom: none;
}

.cuentas-table tbody tr:hover {
  background-color: #f8f9fa;
}

.cell-actions-small {
  text-align: center;
}

.icon-button-small {
  width: 31px;
  height: 31px;
  border: 1px solid #d6dbe3;
  background: #ffffff;
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  border-radius: 6px;
  transition: all 0.16s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #5f6368;
}

.icon-button-small:hover {
  transform: translateY(-1px);
}

.action-edit-small {
  color: #174ea6;
  background: #e8f0fe;
  border-color: #c6dafc;
}

.action-delete-small {
  color: #d93025;
  background: #fdeceb;
  border-color: #f6c8c4;
}

.badge-muted {
  background-color: #e8eaed;
  color: #3c4043;
}

/* Formularios */
.alumno-form,
.cuenta-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.form-grid .span-2 {
  grid-column: span 2;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.form-grid .span-2 {
  grid-column: span 2;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem 0;
  user-select: none;
  font-size: 0.95rem;
  color: #202124;
}

.field-checkbox input {
  cursor: pointer;
  width: 18px;
  height: 18px;
  border-radius: 2px;
  border: 2px solid #dadce0;
  accent-color: #1a73e8;
  transition: border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.field-checkbox input:hover {
  border-color: #1a73e8;
}

.field-checkbox input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
}

.form-grid-single {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #3c4043;
}

.form-inline-hint {
  margin: -0.2rem 0 0;
  font-size: 0.78rem;
  color: #8a6100;
  background: #fef7e0;
  border: 1px solid #f3de98;
  border-radius: 8px;
  padding: 0.45rem 0.6rem;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 1rem;
  color: #202124;
  background-color: #f8f9fa;
  transition: border-color 0.2s, box-shadow 0.2s;
  resize: vertical;
  min-height: 100px;
}

.form-textarea:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.15);
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .page-header-meta {
    width: 100%;
    justify-content: flex-start;
  }

  .table-actions {
    flex-direction: column;
  }

  .table-search-input,
  .table-filter-select {
    width: 100%;
  }

  .alumno-modal-shell {
    padding: 0.8rem 0.75rem;
    border-radius: 12px;
  }

  .table {
    font-size: 0.75rem;
  }

  .table th,
  .table td {
    padding: 0.75rem 0.5rem;
  }

  .details-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
