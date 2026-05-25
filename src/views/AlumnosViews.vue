<!-- src/views/AlumnosView.vue -->
<template>
  <section class="page g-page-animate">
    <!-- Botón para volver a Inicio -->
    <div class="back-to-home">
      <RouterLink to="/inicio" custom v-slot="{ navigate }">
        <GoogleButton @click="navigate" variant="text" size="sm">
          <span class="material-symbols-outlined">arrow_back</span>
          Volver a inicio
        </GoogleButton>
      </RouterLink>
    </div>

    <!-- Header estilo Google -->
    <header class="page-header">
      <div>
        <h2 class="page-title">Alumnos</h2>
        <p class="page-subtitle">
          Gestión de alumnos, datos de contacto y seguimiento del plan de estudio.
        </p>
      </div>

      <div class="page-header-meta">
        <span class="chip chip-soft">
          Total: <strong>{{ alumnos.length }}</strong>
        </span>

        <!-- Botón "Nuevo alumno" - Visible para Admin y Coordinador -->
        <GoogleButton v-if="auth.can('action.alumno.create')" size="sm" @click="openCreateForm">
          <span class="material-symbols-outlined">add</span>
          Nuevo alumno
        </GoogleButton>
      </div>
    </header>

    <!-- Tabla -->
    <AlumnosTable :alumnos="alumnos" :carreras="carreras" :loading="loadingList" v-model:search="search"
      @reload="loadAlumnos" @edit="onEdit" @delete="onDelete" @bulk-edit="openBulkEdit"
      @bulk-delete="onBulkDelete" />

    <!-- Modal: Crear / Editar alumno -->
    <GoogleModal v-model="showFormModal" :icon="isEditing ? 'edit' : 'person_add'"
      :title="isEditing ? 'Editar alumno' : 'Nuevo alumno'"
      subtitle="Completa los campos obligatorios para guardar los cambios." maxWidth="760px" density="comfortable"
      :showFooter="false" :showAddAnother="!isEditing" v-model:addAnother="addAnother">
      <AlumnosForm :form="form" :carreras="carreras" :conceptos="conceptos" :ciclos="ciclos" :metodos-pago="metodos"
        :enable-initial-debt="false"
        :is-editing="isEditing" :loading="loadingCreate" @submit="handleFormSubmit" @cancel-edit="handleCancelForm"
        @download-template="downloadTemplate" @open-bulk-modal="openBulkModal" />
    </GoogleModal>

    <GoogleModal v-model="showBulkEditModal" icon="group" title="Editar alumnos en lote"
      subtitle="Actualiza matrícula, nombre, contacto, plan, semestre y estado de múltiples alumnos."
      maxWidth="1000px" density="comfortable" :confirmLoading="loadingBulkEdit" confirmText="Guardar cambios"
      cancelText="Cancelar" @confirm="submitBulkEdit" @cancel="closeBulkEditModal">
      <form class="bulk-edit-form" @submit.prevent="submitBulkEdit">
        <p class="bulk-edit-summary">Seleccionados: <strong>{{ bulkEditRows.length }}</strong></p>
        <div class="bulk-edit-table-wrap">
          <table class="bulk-edit-table">
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Plan</th>
                <th>Semestre</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in bulkEditRows" :key="`${row.original_matricula}-${index}`">
                <td><input v-model.trim="row.matricula" class="bulk-input" /></td>
                <td><input v-model.trim="row.nombre_completo" class="bulk-input" /></td>
                <td><input v-model.trim="row.email_institucional" class="bulk-input" /></td>
                <td><input v-model.trim="row.telefono_contacto" class="bulk-input" /></td>
                <td>
                  <select v-model.number="row.id_carrera" class="bulk-input">
                    <option v-for="c in carreras" :key="c.id_carrera" :value="c.id_carrera">
                      {{ c.clave }} - {{ c.nombre }}
                    </option>
                  </select>
                </td>
                <td><input v-model.number="row.semestre_actual" type="number" min="1" class="bulk-input" /></td>
                <td>
                  <select v-model.number="row.activo" class="bulk-input">
                    <option :value="1">Activo</option>
                    <option :value="0">Inactivo</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </form>
    </GoogleModal>

    <!-- Modal carga masiva -->
    <AlumnosBulkModal v-model="showBulkModal" :file-name="bulkFileName" :rows="bulkRows" :errors="bulkErrors"
      :parsing="bulkParsing" :loading="bulkLoading" :progress="bulkProgress" @file-change="onBulkFileChange"
      @upload="onBulkUpload" />

    <ConfirmModal v-model="showDeleteConfirm" title="Eliminar alumno"
      :message="deleteTarget ? `¿Eliminar alumno ${deleteTarget}?` : ''" variant="danger" confirmText="Eliminar"
      @confirm="onDeleteConfirm" />

    <ConfirmModal v-model="showBulkDeleteConfirm" title="Eliminar alumnos"
      :message="`¿Eliminar ${bulkDeleteTargets.length} alumno(s) seleccionados?`" variant="danger" confirmText="Eliminar"
      @confirm="onBulkDeleteConfirm" />
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';

import AlumnosForm from '../components/formulario/AlumnosForm.vue';
import AlumnosTable from '../components/formulario/AlumnosTable.vue';
import AlumnosBulkModal from '../components/modal/AlumnosBulkModal.vue';
import GoogleModal from '../components/modal/modal.vue';
import GoogleButton from '../components/ui/button.vue';
import ConfirmModal from '../components/modal/ConfirmModal.vue';

import {
  getAlumnos,
  createAlumno,
  updateAlumno,
  deleteAlumno,
  type Alumno,
  type AlumnoCreate,
} from '../services/alumnos';
import {
  getCarreras,
  type Carrera,
} from '../services/carreras';
import { getConceptos, type Concepto } from '../services/conceptos';
import { getCiclosEscolares, type CicloEscolar } from '../services/ciclos-escolares';
import { getMetodosPago, type MetodoPago } from '../services/metodo-pago';
import { createCuenta, type CuentaPayload } from '../services/cuentas';
import { runWithConcurrency } from '../utils/async';

// ---------- Estado principal ----------
const alumnos = ref<Alumno[]>([]);
const carreras = ref<Carrera[]>([]);
const conceptos = ref<Concepto[]>([]);
const ciclos = ref<CicloEscolar[]>([]);
const metodos = ref<MetodoPago[]>([]);

const loadingList = ref(false);
const loadingCreate = ref(false);
const loadingCarreras = ref(false);

const isEditing = ref(false);
const editingMatricula = ref<string | null>(null);
const search = ref('');

// ---------- Modal formulario ----------
const showFormModal = ref(false);
const showDeleteConfirm = ref(false);
const deleteTarget = ref<string | null>(null);
const showBulkDeleteConfirm = ref(false);
const bulkDeleteTargets = ref<string[]>([]);

// ---------- Carga masiva ----------
const showBulkModal = ref(false);
const bulkFileName = ref('');
const bulkParsing = ref(false);
const bulkRows = ref<(AlumnoCreate & { activo: boolean })[]>([]);
const bulkErrors = ref<string[]>([]);
const bulkLoading = ref(false);
const bulkProgress = ref({ processed: 0, total: 0 });

// Agregar otro
const addAnother = ref(false);

const showBulkEditModal = ref(false);
const loadingBulkEdit = ref(false);

type BulkAlumnoEditRow = {
  original_matricula: string;
  matricula: string;
  nombre_completo: string;
  email_institucional: string;
  telefono_contacto: string;
  id_carrera: number;
  semestre_actual: number;
  activo: number;
};

const bulkEditRows = ref<BulkAlumnoEditRow[]>([]);

const alumnosByMatricula = computed(() =>
  new Map(alumnos.value.map((alumno) => [alumno.matricula, alumno])),
);

// ---------- Helpers de formulario ----------
const createEmptyForm = (): any => ({
  matricula: '',
  nombre_completo: '',
  email_institucional: '',
  telefono_contacto: '',
  id_carrera: null as any,
  semestre_actual: 1,
  activo: true,
  // Campos extra para adeudo
  con_adeudo: false,
  adeudos: []
});

const auth = useAuthStore();
const toast = useToast();
const form = ref<any>(createEmptyForm());

const resetForm = () => {
  form.value = createEmptyForm();
  isEditing.value = false;
  editingMatricula.value = null;
};

async function loadXlsxModule() {
  return import('xlsx');
}

// ---------- Carga de datos ----------
async function loadAlumnos() {
  try {
    loadingList.value = true;
    alumnos.value = await getAlumnos();
  } catch (e) {
    console.error(e);
    toast.error('Error al cargar alumnos');
  } finally {
    loadingList.value = false;
  }
}

async function loadCarreras() {
  try {
    loadingCarreras.value = true;
    carreras.value = await getCarreras();
  } catch (e) {
    console.error(e);
  } finally {
    loadingCarreras.value = false;
  }
}

async function loadExtras() {
  try {
    const [concData, ciclData, metData] = await Promise.all([
      getConceptos(),
      getCiclosEscolares(),
      getMetodosPago()
    ]);
    conceptos.value = concData;
    ciclos.value = ciclData;
    metodos.value = metData;
  } catch (e) {
    console.error(e);
  }
}

onMounted(async () => {
  await Promise.all([loadAlumnos(), loadCarreras(), loadExtras()]);
});

// ---------- CRUD Alumno ----------
async function saveAlumno() {
  try {
    loadingCreate.value = true;

    if (isEditing.value && editingMatricula.value) {
      const { matricula, con_adeudo, adeudos, ...payload } = form.value;
      const updated = await updateAlumno(editingMatricula.value, payload);
      alumnos.value = alumnos.value.map((a) =>
        a.matricula === editingMatricula.value ? updated : a,
      );
    } else {
      const { con_adeudo, adeudos, ...createPayload } = form.value;
      // 1. Crear alumno
      const created = await createAlumno(createPayload as AlumnoCreate);
      alumnos.value.push(created);

      // 2. Crear adeudos iniciales si aplica
      if (form.value.con_adeudo && form.value.adeudos && form.value.adeudos.length > 0) {
        for (const adeudo of form.value.adeudos) {
          if (!adeudo.concepto) continue;
          const payload: CuentaPayload = {
            matricula: form.value.matricula,
            concepto: adeudo.concepto,
            id_ciclo: adeudo.id_ciclo || 1,
            monto: adeudo.monto || 0,
            pagado: adeudo.pagado || false,
            fecha_pago: adeudo.pagado ? adeudo.fecha_pago : null,
            id_metodo: adeudo.pagado ? adeudo.id_metodo : null,
          };
          await createCuenta(payload);
        }
      }
    }

    resetForm();
  } catch (e) {
    console.error(e);
    toast.error(isEditing.value
      ? 'Error al actualizar alumno'
      : 'Error al crear alumno');
  } finally {
    loadingCreate.value = false;
  }
}

// Usado por el botón "Nuevo alumno"
function openCreateForm() {
  resetForm();
  isEditing.value = false;
  showFormModal.value = true;
}

// Click en editar desde la tabla
function onEdit(alumno: Alumno) {
  isEditing.value = true;
  editingMatricula.value = alumno.matricula;

  form.value = {
    matricula: alumno.matricula,
    nombre_completo: alumno.nombre_completo,
    email_institucional: alumno.email_institucional ?? '',
    telefono_contacto: alumno.telefono_contacto ?? '',
    id_carrera: alumno.id_carrera,
    semestre_actual: alumno.semestre_actual,
    activo: alumno.activo,
  };

  showFormModal.value = true;
}

// Cancelar edición (desde el form)
function onCancelEdit() {
  resetForm();
}

// Handlers que conectan el form con el modal
async function handleFormSubmit() {
  await saveAlumno();
  if (addAnother.value && !isEditing.value) {
    // Ya saveAlumno hizo resetForm()
  } else {
    showFormModal.value = false;
  }
}

function handleCancelForm() {
  onCancelEdit();
  showFormModal.value = false;
}

function openBulkEdit(matriculas: string[]) {
  bulkEditRows.value = matriculas
    .map((matricula) => alumnosByMatricula.value.get(matricula))
    .filter((item): item is Alumno => Boolean(item))
    .map((alumno) => ({
      original_matricula: alumno.matricula,
      matricula: alumno.matricula,
      nombre_completo: alumno.nombre_completo,
      email_institucional: alumno.email_institucional ?? '',
      telefono_contacto: alumno.telefono_contacto ?? '',
      id_carrera: Number(alumno.id_carrera),
      semestre_actual: Number(alumno.semestre_actual),
      activo: alumno.activo ? 1 : 0,
    }));

  if (!bulkEditRows.value.length) return;
  showBulkEditModal.value = true;
}

function closeBulkEditModal() {
  showBulkEditModal.value = false;
  bulkEditRows.value = [];
}

function validateBulkEditRows(): string | null {
  const seen = new Set<string>();

  for (const row of bulkEditRows.value) {
    if (!String(row.matricula).trim()) return 'Todas las matrículas son obligatorias.';
    if (!String(row.nombre_completo).trim()) return 'Todos los nombres son obligatorios.';
    if (!Number.isFinite(Number(row.id_carrera)) || Number(row.id_carrera) <= 0) {
      return 'Todos los alumnos deben tener carrera válida.';
    }
    if (!Number.isFinite(Number(row.semestre_actual)) || Number(row.semestre_actual) <= 0) {
      return 'Todos los semestres deben ser mayores a 0.';
    }

    const matricula = String(row.matricula).trim();
    if (seen.has(matricula)) return `Matrícula repetida en lote: ${matricula}`;
    seen.add(matricula);
  }

  return null;
}

async function submitBulkEdit() {
  if (!bulkEditRows.value.length) return;

  const validationError = validateBulkEditRows();
  if (validationError) {
    toast.error(validationError);
    return;
  }

  loadingBulkEdit.value = true;

  try {
    const results = await runWithConcurrency(bulkEditRows.value, 6, (row) =>
      updateAlumno(row.original_matricula, {
        matricula: String(row.matricula).trim(),
        nombre_completo: String(row.nombre_completo).trim(),
        email_institucional: String(row.email_institucional).trim(),
        telefono_contacto: String(row.telefono_contacto).trim(),
        id_carrera: Number(row.id_carrera),
        semestre_actual: Number(row.semestre_actual),
        activo: Number(row.activo) === 1,
      }),
    );

    const failed = results.filter((result) => result.status === 'rejected').length;
    await loadAlumnos();

    if (failed > 0) {
      toast.error(`Se actualizaron ${results.length - failed} de ${results.length} alumnos.`);
      return;
    }

    closeBulkEditModal();
  } catch (e: any) {
    console.error(e);
    toast.error(`Error al actualizar alumnos en lote: ${e?.response?.data?.message ?? e?.message ?? 'Error desconocido'}`);
  } finally {
    loadingBulkEdit.value = false;
  }
}

function onBulkDelete(matriculas: string[]) {
  if (!matriculas.length) return;
  bulkDeleteTargets.value = matriculas;
  showBulkDeleteConfirm.value = true;
}

async function onBulkDeleteConfirm() {
  const matriculas = bulkDeleteTargets.value;
  if (!matriculas.length) return;

  showBulkDeleteConfirm.value = false;
  loadingList.value = true;

  try {
    const results = await runWithConcurrency(matriculas, 6, (matricula) => deleteAlumno(matricula));

    const failed = results.filter((result) => result.status === 'rejected').length;
    await loadAlumnos();

    if (failed > 0) {
      toast.error(`Se eliminaron ${results.length - failed} de ${results.length} alumnos.`);
    }
  } catch (e: any) {
    console.error(e);
    toast.error(`Error al eliminar alumnos en lote: ${e?.response?.data?.message ?? e?.message ?? 'Error desconocido'}`);
  } finally {
    loadingList.value = false;
  }
}

function onDelete(matricula: string) {
  deleteTarget.value = matricula;
  showDeleteConfirm.value = true;
}

async function onDeleteConfirm() {
  const matricula = deleteTarget.value;
  if (!matricula) return;
  try {
    await deleteAlumno(matricula);
    alumnos.value = alumnos.value.filter((a) => a.matricula !== matricula);
    if (editingMatricula.value === matricula) {
      resetForm();
    }
  } catch (e) {
    console.error(e);
    toast.error('Error al eliminar alumno');
  } finally {
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
  }
}

// ---------- Plantilla Excel ----------
async function downloadTemplate() {
  const XLSX = await loadXlsxModule();

  const headers = [
    'matricula',
    'nombre_completo',
    'email_institucional',
    'telefono_contacto',
    'id_carrera',
    'semestre_actual',
    'activo',
  ];

  const exampleRow = [
    '180054',
    'Juan Pérez',
    'juan.perez@uadec.mx',
    '871-000-0000',
    '1',
    '3',
    'TRUE',
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'alumnos');

  XLSX.writeFile(workbook, 'plantilla_alumnos.xlsx');
}

// ---------- Carga masiva ----------
function resetBulkState() {
  bulkFileName.value = '';
  bulkParsing.value = false;
  bulkRows.value = [];
  bulkErrors.value = [];
  bulkLoading.value = false;
  bulkProgress.value = { processed: 0, total: 0 };
}

function openBulkModal() {
  resetBulkState();
  showBulkModal.value = true;
}

async function onBulkFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  bulkFileName.value = file.name;
  bulkParsing.value = true;
  bulkErrors.value = [];
  bulkRows.value = [];
  bulkProgress.value = { processed: 0, total: 0 };

  try {
    const XLSX = await loadXlsxModule();
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      bulkErrors.value.push('El archivo de Excel no contiene hojas.');
      bulkParsing.value = false;
      return;
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      bulkErrors.value.push('No se pudo encontrar la hoja especificada.');
      bulkParsing.value = false;
      return;
    }

    const json = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

    type MappedRow = {
      matricula: string;
      nombre_completo: string;
      email_institucional: string;
      telefono_contacto: string;
      id_carrera: number;
      semestre_actual: number;
      activo: boolean;
      _rowIndex: number;
    };

    const mapped: MappedRow[] = json.map((row, index) => {
      const matricula = String(row.matricula ?? row.Matricula ?? '').trim();
      const nombre_completo = String(row.nombre_completo ?? row.Nombre ?? '').trim();
      const email_institucional = String(
        row.email_institucional ?? row.Email ?? '',
      ).trim();
      const telefono_contacto = String(
        row.telefono_contacto ?? row.Telefono ?? '',
      ).trim();
      const id_carrera = Number(
        row.id_carrera ?? row.IdCarrera ?? row.carrera_id ?? 0,
      );
      const semestre_actual = Number(
        row.semestre_actual ?? row.Semestre ?? 1,
      );
      const activo =
        row.activo === '' || row.activo === undefined
          ? true
          : Boolean(row.activo);

      return {
        matricula,
        nombre_completo,
        email_institucional,
        telefono_contacto,
        id_carrera,
        semestre_actual,
        activo,
        _rowIndex: index + 2,
      };
    });

    const seenMatriculas = new Set<string>();
    const existingMatriculas = new Set(alumnos.value.map(a => a.matricula));
    const validRows: MappedRow[] = [];

    for (const r of mapped) {
      if (!r.matricula || !r.nombre_completo || !r.id_carrera) {
        bulkErrors.value.push(
          `Fila ${r._rowIndex}: faltan datos obligatorios (matricula, nombre_completo o id_carrera).`,
        );
        continue;
      }

      if (seenMatriculas.has(r.matricula)) {
        bulkErrors.value.push(
          `Fila ${r._rowIndex}: matrícula duplicada en el archivo (${r.matricula}).`,
        );
        continue;
      }

      if (existingMatriculas.has(r.matricula)) {
        bulkErrors.value.push(
          `Fila ${r._rowIndex}: la matrícula ya existe en el sistema (${r.matricula}).`,
        );
        continue;
      }

      seenMatriculas.add(r.matricula);
      validRows.push(r);
    }

    bulkRows.value = validRows.map((r) => ({
      matricula: r.matricula,
      nombre_completo: r.nombre_completo,
      email_institucional: r.email_institucional,
      telefono_contacto: r.telefono_contacto,
      id_carrera: r.id_carrera,
      semestre_actual: r.semestre_actual,
      activo: r.activo,
    }));

    bulkProgress.value.total = bulkRows.value.length;

    if (!bulkRows.value.length) {
      bulkErrors.value.push(
        'No se encontraron filas válidas después de las validaciones.',
      );
    }
  } catch (err: any) {
    console.error(err);
    bulkErrors.value.push(
      'Error al leer el archivo. Verifica que sea un Excel válido.',
    );
  } finally {
    bulkParsing.value = false;
  }
}

async function onBulkUpload() {
  if (!bulkRows.value.length) return;

  bulkLoading.value = true;
  bulkErrors.value = [];
  bulkProgress.value.processed = 0;

  for (const [index, row] of bulkRows.value.entries()) {
    const excelRowNumber = index + 2;

    try {
      const created = await createAlumno(row);
      alumnos.value.push(created);
    } catch (err: any) {
      console.error(err);
      const backendMsg =
        err?.response?.data?.message ??
        err?.message ??
        'Error desconocido';

      bulkErrors.value.push(
        `Fila ${excelRowNumber} (matrícula ${row.matricula}): ${backendMsg}`,
      );
    } finally {
      bulkProgress.value.processed++;
    }
  }

  bulkLoading.value = false;
}

// Limpiar estado al cerrar el modal de carga masiva
watch(showBulkModal, (value) => {
  if (!value) {
    resetBulkState();
  }
});

// Eliminado de onMounted original ya que se movió arriba o se maneja diferente
</script>

<style scoped>
/* Animación suave tipo Google */
.g-page-animate {
  animation: g-fade-in 180ms ease-out;
}

@keyframes g-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
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
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.page-subtitle {
  font-size: 0.9rem;
  color: var(--md-sys-color-on-surface-variant);
  margin-top: 0.25rem;
}

.page-header-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  font-size: 0.78rem;
  border: 1px solid transparent;
}

.chip-soft {
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface-variant);
}

.chip-primary {
  background: var(--md-sys-color-primary-container);
  border-color: var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-primary-container);
}

.bulk-edit-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bulk-edit-summary {
  margin: 0;
  color: var(--md-sys-color-on-surface);
  font-size: 0.85rem;
}

.bulk-edit-table-wrap {
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 10px;
  overflow: auto;
  max-height: 380px;
}

.bulk-edit-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

.bulk-edit-table th,
.bulk-edit-table td {
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  padding: 0.45rem 0.5rem;
  text-align: left;
  vertical-align: middle;
}

.bulk-edit-table th {
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  position: sticky;
  top: 0;
  z-index: 1;
}

.bulk-input {
  width: 100%;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: 8px;
  padding: 0.35rem 0.5rem;
  font-size: 0.84rem;
}
</style>
