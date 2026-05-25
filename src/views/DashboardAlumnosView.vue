<!-- src/views/DashboardAlumnosView.vue -->
<template>
  <section class="page dashboard-page g-page-animate">
    <!-- Header Principal -->
    <header class="dashboard-header">
      <div class="header-content">
        <h2 class="page-title">Gestión de Alumnos</h2>
        <p class="page-subtitle">Panel centralizado para el control de alumnos, ciclos y adeudos.</p>
      </div>

      <div class="header-actions">
        <DashboardStats 
          :totalAlumnos="alumnos.length" 
          :totalPendiente="totalPendiente" 
        />
        
        <div class="primary-buttons">
          <GoogleButton v-if="auth.can('action.catalogos.manage')" variant="tonal" @click="showCarrerasManager = true">
            <span class="material-symbols-outlined">school</span>
            Planes
          </GoogleButton>

          <GoogleButton v-if="auth.can('action.catalogos.manage')" variant="tonal" @click="showConceptosManager = true">
            <span class="material-symbols-outlined">receipt_long</span>
            Conceptos
          </GoogleButton>

          <GoogleButton variant="filled" @click="openCreateAlumno">
            <span class="material-symbols-outlined">person_add</span>
            Nuevo Alumno
          </GoogleButton>
        </div>
      </div>
    </header>

    <!-- Sección de Filtros y Tabla -->
    <main class="dashboard-main">
      <FilterBar compact :activeCount="filterActiveCount" @clear="clearFilters">
        <GoogleInput
          v-model="search"
          class="filter-search-input"
          size="sm"
          placeholder="Buscar matrícula o nombre..."
          icon="search"
        />

        <GoogleSelect
          v-model="filterCarrera"
          :options="carreraOptions"
          placeholder="Plan"
          size="sm"
          :disabled="!auth.can('filters.carrera.change')"
        />

        <GoogleSelect
          v-model="filterCiclo"
          :options="cicloOptions"
          placeholder="Ciclo"
          size="sm"
        />

        <GoogleSelect
          v-model="filterSemestre"
          :options="semestreOptions"
          placeholder="Semestre"
          size="sm"
        />

        <GoogleSelect
          v-model="filterPago"
          :options="pagoOptions"
          placeholder="Pago"
          size="sm"
        />

        <template #actions>
          <GoogleButton variant="text" size="sm" @click="loadData" title="Recargar">
            <span class="material-symbols-outlined">refresh</span>
          </GoogleButton>

          <template v-if="selectedCount > 0">
            <GoogleButton variant="outlined" size="sm" @click="openBulkEditModal">
              <span class="material-symbols-outlined">edit_square</span>
              Editar ({{ selectedCount }})
            </GoogleButton>

            <GoogleButton variant="text" size="sm" class="btn-danger" @click="deleteSelectedAlumnos" title="Eliminar seleccionados">
              <span class="material-symbols-outlined">delete_sweep</span>
            </GoogleButton>
          </template>
        </template>
      </FilterBar>

      <AlumnoDataTable 
        :data="filteredData"
        :selectedMatriculas="selectedMatriculas"
        :isAllSelected="isAllFilteredSelected"
        :isSomeSelected="isSomeFilteredSelected"
        @toggle-all="toggleSelectAllFilteredFromEvent"
        @toggle-row="setMatriculaSelected"
        @view="openDetails"
        @edit="editAlumno"
        @delete="deleteAlumno"
      />
    </main>

    <!-- Modales de Negocio -->
    <BulkEditModal 
      v-model="showBulkEditModal"
      v-model:advancedMode="bulkEditAdvancedMode"
      :rows="bulkEditRows"
      :form="bulkEditForm"
      :loading="loadingBulk"
      :carreraOptions="carreraOptions"
      :cicloOptions="cicloOptions"
      :activoOptions="activoOptions"
      @confirm="submitBulkEdit"
    />

    <AlumnoDetailsModal 
      v-model="showDetailsModal"
      :alumnoData="selectedRowComputed"
      :cuentas="selectedRowCuentas"
      :observaciones="selectedRowObservaciones"
      :getCicloNombre="getCicloNombre"
      :getUsuarioNombre="getUsuarioNombre"
      :formatDate="formatDate"
      :getTipoLabel="getObservacionTipoLabel"
      @add-cuenta="openNewCuentaFromDetails"
      @edit-cuenta="editCuenta"
      @delete-cuenta="deleteCuenta"
      @add-observacion="openNewObservacion"
      @edit-observacion="editObservacion"
      @delete-observacion="deleteObservacion"
    />

    <!-- Modal: Gestionar Carreras -->
    <GoogleModal v-model="showCarrerasManager" title="Gestionar Planes de Estudio" maxWidth="1200px" :showFooter="false">
      <CarrerasManager @update="loadData" />
    </GoogleModal>

    <!-- Modal: Gestionar Conceptos -->
    <GoogleModal v-model="showConceptosManager" title="Gestionar Conceptos de Pago" maxWidth="1200px" :showFooter="false">
      <ConceptosManager @update="loadData" />
    </GoogleModal>

    <!-- Modal: Crear/Editar alumno -->
    <GoogleModal v-model="showAlumnoModal" 
      :icon="isEditingAlumno ? 'edit' : 'school'"
      :title="isEditingAlumno ? 'Editar alumno' : 'Alta de alumno'"
      :subtitle="isEditingAlumno ? 'Edita los datos generales.' : 'Registra un nuevo alumno en el sistema.'"
      maxWidth="920px" 
      :showFooter="false" 
      :showAddAnother="!isEditingAlumno" 
      v-model:addAnother="addAnotherAlumno"
    >
      <AlumnosForm 
        v-if="alumnoForm" 
        :form="alumnoForm" 
        :carreras="carreras" 
        :conceptos="conceptos"
        :ciclos="ciclosEscolares" 
        :metodos-pago="metodos" 
        :enable-initial-debt="true"
        :is-editing="isEditingAlumno" 
        :loading="loadingSave"
        @submit="handleAlumnoSubmit" 
        @cancel-edit="showAlumnoModal = false" 
        @open-bulk-modal="showBulkModal = true"
        @download-template="downloadTemplate" 
      />
    </GoogleModal>

    <!-- Modal carga masiva -->
    <AlumnosBulkModal v-model="showBulkModal" :file-name="bulkFileName" :rows="bulkRows" :errors="bulkErrors"
      :parsing="bulkParsing" :loading="bulkLoading" :progress="bulkProgress" @file-change="onBulkFileChange"
      @upload="handleBulkUpload" />

    <!-- Modal: Crear/Editar cuenta -->
    <GoogleModal v-model="showCuentaModal" 
      :icon="isEditingCuenta ? 'edit' : 'request_quote'"
      :title="isEditingCuenta ? 'Editar cuenta' : 'Nueva cuenta por cobrar'"
      subtitle="Registra o modifica una cuenta por cobrar."
      maxWidth="700px" 
      :showFooter="false"
    >
      <CuentaForm 
        v-if="cuentaForm"
        :form="cuentaForm"
        :conceptoOptions="availableConceptoOptionsForCuenta"
        :cicloOptions="cicloOptions"
        :metodoOptions="metodoOptions"
        :loading="loadingSave"
        :isEditing="isEditingCuenta"
        v-model:addAnother="addAnotherCuenta"
        @submit="handleCuentaSubmit"
        @cancel="showCuentaModal = false"
      />
    </GoogleModal>

    <!-- Modal: Crear/Editar Observación -->
    <GoogleModal v-model="showObservacionModal" 
      :icon="isEditingObservacion ? 'edit_note' : 'note_add'"
      :title="isEditingObservacion ? 'Editar observación' : 'Nueva observación'"
      subtitle="Registra una nota o incidencia del alumno."
      maxWidth="600px" 
      :showFooter="false"
    >
      <ObservacionForm 
        v-if="observacionForm"
        :form="observacionForm"
        :tipoOptions="observacionTipoSelectOptions"
        :usuarios="usuarios"
        :currentUsername="getCurrentUsername()"
        :loading="loadingSave"
        :isEditing="isEditingObservacion"
        v-model:addAnother="addAnotherObservacion"
        @submit="handleObservacionSubmit"
        @cancel="showObservacionModal = false"
      />
    </GoogleModal>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
// RouterLink is used dynamically in :is component
import {  } from 'vue-router';
import { useToast } from '../composables/useToast';
import { useAuthStore } from '../stores/auth';

// Componentes UI & Layout
import GoogleButton from '../components/ui/button.vue';
import GoogleInput from '../components/ui/input.vue';
import GoogleSelect from '../components/ui/select.vue';
import GoogleModal from '../components/modal/modal.vue';
import AlumnosForm from '../components/formulario/AlumnosForm.vue';
import CarrerasManager from '../components/mantenimiento/CarrerasManager.vue';
import ConceptosManager from '../components/mantenimiento/ConceptosManager.vue';
import AlumnosBulkModal from '../components/modal/AlumnosBulkModal.vue';

// Componentes Dashboard Modularizados
import DashboardStats from '../components/dashboard/DashboardStats.vue';
import FilterBar from '../components/ui/FilterBar.vue';
import AlumnoDataTable from '../components/dashboard/AlumnoDataTable.vue';
import BulkEditModal from '../components/dashboard/BulkEditModal.vue';
import AlumnoDetailsModal from '../components/dashboard/AlumnoDetailsModal.vue';
import CuentaForm from '../components/dashboard/CuentaForm.vue';
import ObservacionForm from '../components/dashboard/ObservacionForm.vue';

// Servicios (Preserved)
import { getAlumnos, createAlumno, updateAlumno, deleteAlumno as deleteAlumnoAPI, type Alumno } from '../services/alumnos';
import { getCuentas, createCuenta, updateCuenta, deleteCuenta as deleteCuentaAPI, type Cuenta, type CuentaPayload } from '../services/cuentas';
import { getCiclosEscolares, type CicloEscolar } from '../services/ciclos-escolares';
import { getCarreras, type Carrera } from '../services/carreras';
import { getMetodosPago, type MetodoPago } from '../services/metodo-pago';
import { getConceptos, type Concepto } from '../services/conceptos';
import { getObservaciones, getTiposObservacion, createObservacion, updateObservacion, deleteObservacion as deleteObservacionAPI, type Observacion, type TipoObservacion } from '../services/observaciones';
import { getUsuarios, type Usuario } from '../services/usuarios';
import { formatCarreraLabel } from '../utils/carreras';
import { runWithConcurrency } from '../utils/async';

// ============= ESTADO =============
const alumnos = ref<Alumno[]>([]);
const cuentas = ref<Cuenta[]>([]);
const ciclosEscolares = ref<CicloEscolar[]>([]);
const carreras = ref<Carrera[]>([]);
const metodos = ref<MetodoPago[]>([]);
const observaciones = ref<Observacion[]>([]);
const usuarios = ref<Usuario[]>([]);
const conceptos = ref<Concepto[]>([]);
const tiposObservacion = ref<TipoObservacion[]>([]);

const loading = ref(false);
const loadingSave = ref(false);
const loadingBulk = ref(false);
const auth = useAuthStore();
const toast = useToast();

// Filtros & Selección
const search = ref('');
const filterCarrera = ref<number | string>('');
const filterCiclo = ref<number | string>('');
const filterSemestre = ref<number | string>('');
const filterPago = ref('');
const pagoOptions = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Con adeudo' },
  { value: 'pagado', label: 'Al día' },
];
const selectedMatriculas = ref<string[]>([]);
const selectedMatricula = ref<string | null>(null);

// Visibilidad Modales
const showDetailsModal = ref(false);
const showAlumnoModal = ref(false);
const showCuentaModal = ref(false);
const showCarrerasManager = ref(false);
const showConceptosManager = ref(false);
const showObservacionModal = ref(false);
const showBulkEditModal = ref(false);
const showBulkModal = ref(false);

// Control Edición
const isEditingAlumno = ref(false);
const isEditingCuenta = ref(false);
const isEditingObservacion = ref(false);
const addAnotherAlumno = ref(false);
const addAnotherCuenta = ref(false);
const addAnotherObservacion = ref(false);

// Formularios (Datos dinámicos)
const alumnoForm = ref<any | null>(null);
const cuentaForm = ref<Partial<CuentaPayload> & { id_cuenta?: number; fecha_pago: string | null } | null>(null);
const observacionForm = ref<any | null>(null);

// Carga Masiva (AlumnosBulkModal)
const bulkFileName = ref('');
const bulkRows = ref<any[]>([]);
const bulkErrors = ref<string[]>([]);
const bulkParsing = ref(false);
const bulkLoading = ref(false);
const bulkProgress = ref({ processed: 0, total: 0 });

// Selección Múltiple & Bulk Edit
const bulkEditAdvancedMode = ref(true);
const bulkEditRows = ref<any[]>([]);
const bulkEditForm = ref({ applyCarrera: false, id_carrera: null as number | null, applySemestre: false, semestre_actual: 1, applyActivo: false, activo: 1 });
const activoOptions = [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }];

// ============= COMPUTED =============
const carreraOptions = computed(() => carreras.value.map(c => ({ value: c.id_carrera, label: formatCarreraLabel(c) })));
const cicloOptions = computed(() => ciclosEscolares.value.map(c => ({ value: c.id_ciclo, label: c.nombre })));
const semestreOptions = computed(() => {
  const sems = Array.from(new Set(alumnos.value.map(a => Number(a.semestre_actual)).filter(s => s > 0))).sort((a,b) => a-b);
  return [{ value: '', label: 'Todos' }, ...sems.map(s => ({ value: s, label: `Semestre ${s}` }))];
});
const metodoOptions = computed(() => metodos.value.map(m => ({ value: m.id_metodo, label: m.nombre })));
const conceptoOptions = computed(() => conceptos.value.map(c => ({ value: c.clave, label: c.descripcion })));
const observacionTipoSelectOptions = computed(() => tiposObservacion.value.map(t => ({ value: t.clave, label: t.nombre })));

const dashboardData = computed(() => {
  const cicloActual = ciclosEscolares.value.find(c => c.es_actual);
  const cuentasByMatricula = new Map<string, Cuenta[]>();
  cuentas.value.forEach(c => {
    const list = cuentasByMatricula.get(c.matricula) || [];
    list.push(c);
    cuentasByMatricula.set(c.matricula, list);
  });

  return alumnos.value.map(alumno => {
    const carr = carreras.value.find(c => c.id_carrera === alumno.id_carrera);
    const alCts = cuentasByMatricula.get(alumno.matricula) || [];
    const tPend = alCts.filter(c => !c.pagado).reduce((sum, c) => sum + Number(c.monto), 0);
    return {
      alumno,
      matricula: alumno.matricula,
      nombre_completo: alumno.nombre_completo,
      carrera: carr ? formatCarreraLabel(carr) : '-',
      semestre_actual: alumno.semestre_actual || 0,
      cicloActual: cicloActual?.nombre || '-',
      totalPendiente: tPend,
      duracionCarrera: carr?.duracion_semestres || 9,
      cuentasPendientes: alCts.filter(c => !c.pagado).length
    };
  });
});

const filteredData = computed(() => {
  return dashboardData.value.filter(row => {
    const s = search.value.toLowerCase();
    const matchSearch = !search.value || row.matricula.toLowerCase().includes(s) || row.nombre_completo.toLowerCase().includes(s);
    const matchCarrera = !filterCarrera.value || Number(row.alumno.id_carrera) === Number(filterCarrera.value);
    const matchCiclo = !filterCiclo.value || row.cicloActual === ciclosEscolares.value.find(c => Number(c.id_ciclo) === Number(filterCiclo.value))?.nombre;
    const matchSemestre = !filterSemestre.value || Number(row.semestre_actual) === Number(filterSemestre.value);
    const matchPago = !filterPago.value || (filterPago.value === 'pendiente' && row.totalPendiente > 0) || (filterPago.value === 'pagado' && row.totalPendiente === 0);
    return matchSearch && matchCarrera && matchCiclo && matchSemestre && matchPago;
  });
});

const filterActiveCount = computed(() =>
  [search.value, filterCarrera.value, filterCiclo.value, filterSemestre.value, filterPago.value]
    .filter(v => v !== '' && v !== null && v !== undefined).length
);

function clearFilters() {
  search.value = '';
  filterCarrera.value = '';
  filterCiclo.value = '';
  filterSemestre.value = '';
  filterPago.value = '';
}

const totalPendiente = computed(() => dashboardData.value.reduce((sum, row) => sum + row.totalPendiente, 0));
const selectedCount = computed(() => selectedMatriculas.value.length);
const isAllFilteredSelected = computed(() => filteredData.value.length > 0 && filteredData.value.every(row => selectedMatriculas.value.includes(row.matricula)));
const isSomeFilteredSelected = computed(() => {
  const selInView = filteredData.value.filter(row => selectedMatriculas.value.includes(row.matricula)).length;
  return selInView > 0 && selInView < filteredData.value.length;
});

const selectedRowComputed = computed(() => selectedMatricula.value ? dashboardData.value.find(r => r.matricula === selectedMatricula.value) || null : null);
const selectedRowCuentas = computed(() => selectedMatricula.value ? cuentas.value.filter(c => c.matricula === selectedMatricula.value) : []);
const selectedRowObservaciones = computed(() => selectedMatricula.value ? observaciones.value.filter(o => o.matricula === selectedMatricula.value).sort((a,b) => new Date(b.fecha ?? '').getTime() - new Date(a.fecha ?? '').getTime()) : []);
const availableConceptoOptionsForCuenta = computed(() => {
  if (!cuentaForm.value) return conceptoOptions.value;
  const taken = new Set(selectedRowCuentas.value.map(c => c.concepto.toLowerCase()));
  return conceptoOptions.value.filter(opt => !taken.has(opt.value.toString().toLowerCase()) || opt.value === cuentaForm.value?.concepto);
});

// ============= MÉTODOS =============
async function loadData() {
  loading.value = true;
  try {
    const [al, cu, ci, ca, me, ob, tp, us, co] = await Promise.allSettled([
      getAlumnos(), getCuentas(), getCiclosEscolares(), getCarreras(), getMetodosPago(), getObservaciones(), getTiposObservacion(), getUsuarios(), getConceptos()
    ]);
    if (al.status === 'fulfilled') alumnos.value = al.value;
    if (cu.status === 'fulfilled') cuentas.value = cu.value;
    if (ci.status === 'fulfilled') ciclosEscolares.value = ci.value;
    if (ca.status === 'fulfilled') carreras.value = ca.value;
    if (me.status === 'fulfilled') metodos.value = me.value;
    if (ob.status === 'fulfilled') observaciones.value = ob.value;
    if (tp.status === 'fulfilled') tiposObservacion.value = tp.value;
    if (us.status === 'fulfilled') usuarios.value = us.value;
    if (co.status === 'fulfilled') conceptos.value = co.value;
  } catch (err) { console.error(err); toast.error("Error al cargar datos."); }
  finally { loading.value = false; }
}

function setMatriculaSelected(matricula: string, selected: boolean) {
  if (selected) { if (!selectedMatriculas.value.includes(matricula)) selectedMatriculas.value.push(matricula); }
  else { selectedMatriculas.value = selectedMatriculas.value.filter(m => m !== matricula); }
}

function toggleSelectAllFilteredFromEvent(checked: boolean) {
  if (checked) selectedMatriculas.value = Array.from(new Set([...selectedMatriculas.value, ...filteredData.value.map(r => r.matricula)]));
  else { const visible = new Set(filteredData.value.map(r => r.matricula)); selectedMatriculas.value = selectedMatriculas.value.filter(m => !visible.has(m)); }
}

// Alumnos CRUD
const openCreateAlumno = () => { isEditingAlumno.value = false; alumnoForm.value = { matricula: '', nombre_completo: '', email_institucional: '', id_carrera: null, semestre_actual: 1 }; showAlumnoModal.value = true; };
const editAlumno = (alumno: any) => { isEditingAlumno.value = true; alumnoForm.value = { ...alumno }; showAlumnoModal.value = true; };
async function handleAlumnoSubmit() { 
  if (!alumnoForm.value) return;
  loadingSave.value = true; 
  try { 
    if (isEditingAlumno.value) await updateAlumno(alumnoForm.value.matricula, alumnoForm.value); 
    else await createAlumno(alumnoForm.value); 
    await loadData(); 
    if (!addAnotherAlumno.value) showAlumnoModal.value = false; 
  } finally { loadingSave.value = false; } 
}
const deleteAlumno = async (matricula: string) => { if (!confirm(`¿Eliminar al alumno ${matricula}?`)) return; try { await deleteAlumnoAPI(matricula); await loadData(); } catch (err) { console.error(err); } };
const deleteSelectedAlumnos = async () => { if (!confirm(`¿Eliminar ${selectedCount.value} alumnos?`)) return; loadingBulk.value = true; try { await runWithConcurrency(selectedMatriculas.value, 5, async (m) => { await deleteAlumnoAPI(m); }); selectedMatriculas.value = []; await loadData(); } finally { loadingBulk.value = false; } };

// Cuentas CRUD
const openNewCuentaFromDetails = (matricula: string) => { isEditingCuenta.value = false; cuentaForm.value = { matricula, concepto: '', id_ciclo: ciclosEscolares.value.find(c => c.es_actual)?.id_ciclo, monto: 0, pagado: false, fecha_pago: null }; showCuentaModal.value = true; };
const editCuenta = (cuenta: Cuenta) => { isEditingCuenta.value = true; cuentaForm.value = { ...cuenta, fecha_pago: cuenta.fecha_pago || null }; showCuentaModal.value = true; };
async function handleCuentaSubmit() { if (!cuentaForm.value) return; loadingSave.value = true; try { if (isEditingCuenta.value) await updateCuenta(cuentaForm.value.id_cuenta!, cuentaForm.value as CuentaPayload); else await createCuenta(cuentaForm.value as CuentaPayload); await loadData(); if (!addAnotherCuenta.value) showCuentaModal.value = false; } finally { loadingSave.value = false; } }
const deleteCuenta = async (id: number) => { if (!confirm('¿Eliminar cuenta?')) return; try { await deleteCuentaAPI(id); await loadData(); } catch (err) { console.error(err); } };

// Observaciones CRUD
const openNewObservacion = (matricula: string) => { isEditingObservacion.value = false; observacionForm.value = { matricula, detalle: '', tipo_clave: 'GENERAL', autorTexto: '' }; showObservacionModal.value = true; };
const editObservacion = (obs: Observacion) => { isEditingObservacion.value = true; observacionForm.value = { ...obs, autorTexto: usuarios.value.find(u => u.id_usuario === obs.id_autor)?.username || '' }; showObservacionModal.value = true; };
async function handleObservacionSubmit() { if (!observacionForm.value) return; loadingSave.value = true; try { if (isEditingObservacion.value) await updateObservacion(observacionForm.value.id_observacion!, observacionForm.value); else await createObservacion(observacionForm.value); await loadData(); if (!addAnotherObservacion.value) showObservacionModal.value = false; } finally { loadingSave.value = false; } }
const deleteObservacion = async (id: number) => { if (!confirm('¿Eliminar nota?')) return; try { await deleteObservacionAPI(id); await loadData(); } catch (err) { console.error(err); } };

// Bulk Edit & Details
const openBulkEditModal = () => { bulkEditRows.value = selectedMatriculas.value.map(m => { const d = dashboardData.value.find(row => row.matricula === m); return { original_matricula: m, matricula: m, nombre_completo: d?.nombre_completo || '', id_carrera: d?.alumno.id_carrera || null, semestre_actual: d?.semestre_actual || 1, activo: d?.alumno.activo ? 1 : 0 }; }); showBulkEditModal.value = true; };
async function submitBulkEdit() { loadingBulk.value = true; try { if (bulkEditAdvancedMode.value) { await runWithConcurrency(bulkEditRows.value, 5, async (row) => { await updateAlumno(row.original_matricula, row); }); } else { const updates: any = {}; if (bulkEditForm.value.applyCarrera) updates.id_carrera = bulkEditForm.value.id_carrera; if (bulkEditForm.value.applySemestre) updates.semestre_actual = bulkEditForm.value.semestre_actual; if (bulkEditForm.value.applyActivo) updates.activo = bulkEditForm.value.activo; await runWithConcurrency(selectedMatriculas.value, 5, async (m) => { await updateAlumno(m, updates); }); } await loadData(); showBulkEditModal.value = false; } finally { loadingBulk.value = false; } }
const openDetails = (row: any) => { selectedMatricula.value = row.matricula; showDetailsModal.value = true; };

// Carga Masiva (AlumnosBulkModal) Logic
function downloadTemplate() {
  const headers = "matricula,nombre_completo,email_institucional,id_carrera,semestre_actual\n";
  const blob = new Blob([headers], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla_alumnos.csv';
  a.click();
}

function onBulkFileChange(event: any) {
  const file = event.target.files?.[0];
  if (!file) return;
  bulkFileName.value = file.name;
  bulkParsing.value = true;
  const reader = new FileReader();
  reader.onload = (e: any) => {
    const text = e.target?.result as string;
    if (text) {
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        const header = lines[0]!.split(',');
        const data = lines.slice(1).map(line => {
          const parts = line.split(',');
          const obj: any = {};
          header.forEach((h, i) => obj[h.trim()] = parts[i]?.trim());
          return obj;
        });
        bulkRows.value = data;
      }
      bulkParsing.value = false;
    }
  };
  reader.readAsText(file);
}

async function handleBulkUpload() {
  bulkLoading.value = true;
  bulkProgress.value = { processed: 0, total: bulkRows.value.length };
  try {
    await runWithConcurrency(bulkRows.value, 5, async (row) => {
      await createAlumno(row);
      bulkProgress.value.processed++;
    });
    await loadData();
    showBulkModal.value = false;
  } catch (err) {
    console.error(err);
  } finally {
    bulkLoading.value = false;
  }
}

const getCicloNombre = (id: number) => ciclosEscolares.value.find(c => c.id_ciclo === id)?.nombre || '-';
const getUsuarioNombre = (id: number | null) => usuarios.value.find(u => u.id_usuario === id)?.username || 'Sistema';
const formatDate = (iso: string) => iso ? new Date(iso).toLocaleDateString('es-MX') : '-';
const getObservacionTipoLabel = (obs: Observacion) => tiposObservacion.value.find(t => t.clave === obs.tipo_clave)?.nombre || obs.tipo_clave;
const getCurrentUsername = () => auth.user?.username || '';

onMounted(loadData);
</script>

<style scoped>
.dashboard-page { display: flex; flex-direction: column; gap: 1.25rem; }
.dashboard-header { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
.page-title { font-size: 1.8rem; font-weight: 800; color: var(--md-sys-color-on-surface); margin: 0 0 0.25rem 0; letter-spacing: -0.02em; }
.page-subtitle { color: var(--md-sys-color-on-surface-variant); margin: 0; font-size: 0.875rem; }
.header-actions { display: flex; flex-direction: row; align-items: center; gap: 1rem; flex-wrap: wrap; }
.primary-buttons { display: flex; gap: 0.5rem; }
.dashboard-main { display: flex; flex-direction: column; gap: 1rem; }

@media (max-width: 1024px) { .dashboard-header { flex-direction: column; align-items: flex-start; } .header-actions { width: 100%; justify-content: space-between; } }

.btn-danger { color: var(--md-sys-color-error) !important; }
.btn-danger:hover { background-color: var(--md-sys-color-error-container) !important; }

.filter-search-input {
  flex: 2 !important;
  min-width: 180px;
}
</style>
