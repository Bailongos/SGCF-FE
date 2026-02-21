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

        <GoogleButton v-if="auth.isAdmin" size="sm" color="#1a73e8" @click="showCarrerasManager = true">
          <span class="material-symbols-outlined">school</span>
          Gestionar Planes de Estudio
        </GoogleButton>

        <GoogleButton v-if="auth.isAdmin" size="sm" color="#1a73e8" @click="showConceptosManager = true">
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
          <!-- Botón "Nuevo alumno" PROMINENTE -->
          <GoogleButton size="sm" variant="filled" color="#1a73e8" @click="openCreateAlumno">
            <span class="material-symbols-outlined">person_add</span>
            Nuevo alumno
          </GoogleButton>

          <!-- Buscador -->
          <GoogleInput v-model="search" class="table-search-input" size="sm"
            placeholder="Buscar por matrícula, nombre o plan..." />

          <!-- Filtro por plan de estudio - Deshabilitado para Coordinadores -->
          <GoogleSelect v-model="filterCarrera" class="table-filter-select" :options="carreraOptions"
            placeholder="Todos los planes" size="sm" :disabled="auth.isCoordinator" />

          <!-- Filtro por ciclo -->
          <GoogleSelect v-model="filterCiclo" class="table-filter-select" :options="cicloOptions"
            placeholder="Todos los ciclos" size="sm" />

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
              <th>Plan de Estudio</th>
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
              <td>{{ row.nombre_completo }}</td>
              <td>{{ row.carrera }}</td>
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
                <button class="icon-button" title="Ver detalles" @click="openDetails(row)">
                  <span class="material-symbols-outlined">visibility</span>
                </button>
                <button class="icon-button" title="Editar alumno" @click="editAlumno(row.alumno)">
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button v-if="row.totalPendiente > 0" class="icon-button" title="Nueva cuenta"
                  @click="openNewCuenta(row.matricula)">
                  <span class="material-symbols-outlined">payments</span>
                </button>
                <button class="icon-button icon-danger" title="Eliminar alumno" @click="deleteAlumno(row.matricula)">
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
                    <button class="icon-button-small" title="Editar" @click="editCuenta(cuenta)">
                      <span class="material-symbols-outlined" style="font-size: 1.1rem">edit</span>
                    </button>
                    <button class="icon-button-small icon-danger" title="Eliminar"
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
                  <th>Detalle</th>
                  <th class="cell-actions-small">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="obs in selectedRowObservaciones" :key="obs.id_observacion">
                  <td class="text-muted text-small">{{ formatDate(obs.fecha) }}</td>
                  <td>{{ getUsuarioNombre(obs.id_autor) }}</td>
                  <td>{{ obs.detalle }}</td>
                  <td class="cell-actions-small">
                    <button class="icon-button-small" title="Editar" @click="editObservacion(obs)"><span
                        class="material-symbols-outlined" style="font-size: 1.1rem">edit</span></button>
                    <button class="icon-button-small icon-danger" title="Eliminar"
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
    <GoogleModal v-model="showAlumnoModal" :icon="isEditingAlumno ? 'edit' : 'person_add'"
      :title="isEditingAlumno ? 'Editar alumno' : 'Nuevo alumno'"
      subtitle="Completa los campos obligatorios para guardar los cambios." maxWidth="760px" density="comfortable"
      :showFooter="false" :showAddAnother="!isEditingAlumno" v-model:addAnother="addAnotherAlumno">
      <AlumnosForm v-if="alumnoForm" :form="alumnoForm as any" :carreras="carreras" :conceptos="conceptos"
        :ciclos="ciclosEscolares" :metodos-pago="metodos" :is-editing="isEditingAlumno" :loading="loadingSave"
        @submit="handleAlumnoSubmit" @cancel-edit="handleAlumnoCancel" @open-bulk-modal="showBulkModal = true"
        @download-template="downloadTemplate" />
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
          <GoogleSelect v-model="cuentaForm.concepto" :options="conceptoOptions" label="Concepto *"
            placeholder="Selecciona concepto..." required @update:modelValue="onConceptoDashboardChange" />
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
const filterCarrera = ref<number | string>(auth.userCareerId ?? '');
const filterCiclo = ref<number | string>('');
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
const bulkRows = ref<any[]>([]);
const bulkErrors = ref<string[]>([]);
const bulkParsing = ref(false);
const bulkLoading = ref(false);
const bulkProgress = ref({ processed: 0, total: 0 });


// ============= COMPUTED =============
const carreraOptions = computed(() =>
  carreras.value.map((c) => ({
    value: c.id_carrera,
    label: c.nombre,
  }))
);

const cicloOptions = computed(() =>
  ciclosEscolares.value.map((c) => ({
    value: c.id_ciclo,
    label: c.nombre,
  }))
);

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
      !filterCarrera.value || row.alumno.id_carrera === filterCarrera.value;

    const matchCiclo =
      !filterCiclo.value ||
      ciclosEscolares.value
        .find((c) => c.id_ciclo === filterCiclo.value)
        ?.nombre === row.cicloActual;

    const matchPago =
      !filterPago.value ||
      (filterPago.value === 'pendiente' && row.totalPendiente > 0) ||
      (filterPago.value === 'pagado' && row.totalPendiente === 0);

    return matchSearch && matchCarrera && matchCiclo && matchPago;
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

    // 3. Cargar el resto de los datos en paralelo
    const [alumnosData, cuentasData, carrerasData, metodosData, observacionesData, usuariosData, conceptosData] =
      await Promise.all([
        getAlumnos(),
        getCuentas(),
        getCarreras(),
        getMetodosPago(),
        getObservaciones(),
        getUsuarios(),
        getConceptos()
      ]);

    alumnos.value = alumnosData;
    cuentas.value = cuentasData;
    carreras.value = carrerasData;
    conceptos.value = conceptosData;
    metodos.value = metodosData;
    observaciones.value = observacionesData;
    usuarios.value = usuariosData;

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
  return usuarios.value.find((u) => u.id_usuario === id_autor)?.username || '-';
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

// ============= ALUMNO CRUD =============
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
    con_adeudo: false,
    adeudos: []
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
      await createAlumno(createPayload as AlumnoCreate);

      // 2. Si se marcó adeudo inicial, crearlos
      if (alumnoForm.value.con_adeudo && alumnoForm.value.adeudos && alumnoForm.value.adeudos.length > 0) {
        for (const adeudo of alumnoForm.value.adeudos) {
          if (!adeudo.concepto) continue;
          const cuentaPayload: CuentaPayload = {
            matricula: alumnoForm.value.matricula,
            concepto: adeudo.concepto,
            id_ciclo: adeudo.id_ciclo || 1,
            monto: adeudo.monto || 0,
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
    error.value = isEditingAlumno.value
      ? 'Error al actualizar alumno'
      : 'Error al crear alumno con adeudo inicial';
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
function onConceptoDashboardChange(val: string | number | null) {
  if (val === null || !cuentaForm.value) return;
  const concepto = conceptos.value.find((c) => c.clave === String(val));
  if (concepto && concepto.monto_default) {
    cuentaForm.value.monto = Number(concepto.monto_default);
  }
}

function openNewCuenta(matricula: string) {
  isEditingCuenta.value = false;

  const conceptoDefault = defaultConcepto.value;
  const concepto = conceptos.value.find((c) => c.clave === conceptoDefault);

  cuentaForm.value = {
    matricula,
    concepto: conceptoDefault,
    id_ciclo: ciclosEscolares.value.find((c) => c.es_actual)?.id_ciclo,
    monto: concepto?.monto_default ?? 0,
    pagado: false,
    fecha_pago: null,
    id_metodo: null,
  };
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
    error.value = isEditingCuenta.value
      ? 'Error al actualizar cuenta'
      : 'Error al crear cuenta';
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
  observacionForm.value = {
    matricula: matricula,
    detalle: '',
    autorTexto: '', // Campo para texto libre o username
  };
  showObservacionModal.value = true;
}

function editObservacion(obs: Observacion) {
  isEditingObservacion.value = true;
  observacionForm.value = {
    id_observacion: obs.id_observacion,
    matricula: obs.matricula,
    detalle: obs.detalle,
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
    let autorId: number | null = null;
    if (autorTexto) {
      const foundUser = usuarios.value.find(u => u.username.toLowerCase() === autorTexto.toLowerCase());
      autorId = foundUser ? foundUser.id_usuario : null;
    }

    const payload: ObservacionPayload = {
      matricula: observacionForm.value.matricula!,
      detalle: observacionForm.value.detalle!,
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
function downloadTemplate() {
  const headers = ['matricula', 'nombre_completo', 'email_institucional', 'telefono_contacto', 'id_carrera', 'semestre_actual', 'activo'];
  const sample = [['190123', 'JUAN PÉREZ GARCÍA', 'juan.perez@uadec.edu.mx', '8711112233', 1, 1, 1]];
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
      const json = XLSX.utils.sheet_to_json(sheet) as any[];

      // Mapeo simple de campos
      bulkRows.value = json.map(row => ({
        matricula: String(row.matricula || ''),
        nombre_completo: row.nombre_completo || '',
        email_institucional: row.email_institucional || '',
        telefono_contacto: String(row.telefono_contacto || ''),
        id_carrera: Number(row.id_carrera || 1),
        semestre_actual: Number(row.semestre_actual || 1),
        activo: row.activo != null ? Boolean(row.activo) : true
      }));
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

  for (const row of bulkRows.value) {
    try {
      await createAlumno(row);
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
  // Si es coordinador, forzar su carrera
  if (auth.isCoordinator && auth.userCareerId) {
    filterCarrera.value = auth.userCareerId;
  }
  loadData().then(() => {
    // Dar un poco más de tiempo para que el DOM se renderice tras la carga de datos
    setTimeout(animateEntrance, 200);
  });
});

// Vigilar cambios en el id_carrera del usuario (por si acaso)
watch(() => auth.userCareerId, (newVal) => {
  if (auth.isCoordinator && newVal) {
    filterCarrera.value = newVal;
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

.cell-centered {
  text-align: center;
}

.cell-money {
  text-align: right;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.cell-actions {
  text-align: center;
  white-space: nowrap;
}

.icon-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.icon-button:hover {
  background-color: rgba(60, 64, 67, 0.08);
}

.icon-button:active {
  background-color: rgba(60, 64, 67, 0.12);
}

.icon-button.icon-danger {
  color: #d32f2f;
}

.icon-button.icon-danger:hover {
  background-color: rgba(211, 47, 47, 0.08);
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
  background-color: #fff3cd;
  color: #7f6700;
}

.chip-danger {
  background-color: #fce8e6;
  color: #d32f2f;
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
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.3rem 0.4rem;
  border-radius: 6px;
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #5f6368;
}

.icon-button-small:hover {
  background-color: rgba(60, 64, 67, 0.08);
  color: #202124;
}

.icon-button-small.icon-danger {
  color: #d32f2f;
}

.icon-button-small.icon-danger:hover {
  background-color: rgba(211, 47, 47, 0.08);
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
