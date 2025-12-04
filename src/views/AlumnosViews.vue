<!-- src/views/AlumnosView.vue -->
<template>
  <section class="page">
    <!-- Header estilo Google -->
    <header class="page-header">
      <div>
        <h2 class="page-title">Alumnos</h2>
        <p class="page-subtitle">
          Gestión de alumnos, datos de contacto y seguimiento académico.
        </p>
      </div>
      <div class="page-header-meta">
        <span class="chip chip-soft">
          Total: <strong>{{ alumnos.length }}</strong>
        </span>
      </div>
    </header>

    <!-- Card formulario -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">
            {{ isEditing ? 'Editar alumno' : 'Nuevo alumno' }}
          </h3>
          <p class="card-subtitle">
            Completa los campos obligatorios para
            {{ isEditing ? 'actualizar el registro seleccionado' : 'registrar un nuevo alumno' }}.
          </p>
        </div>
        <span
          v-if="isEditing && form.matricula"
          class="chip chip-primary"
        >
          Editando: {{ form.matricula }}
        </span>
      </div>

      <form @submit.prevent="onSubmit" class="form">
        <div class="form-grid">
          <label class="field">
            <span class="field-label">Matrícula *</span>
            <input
              v-model="form.matricula"
              :disabled="isEditing"
              required
              class="field-input"
              placeholder="Ej. 190123"
            />
          </label>

          <label class="field">
            <span class="field-label">Nombre completo *</span>
            <input
              v-model="form.nombre_completo"
              required
              class="field-input"
              placeholder="Nombre y apellidos"
            />
          </label>

          <label class="field">
            <span class="field-label">Email institucional</span>
            <input
              v-model="form.email_institucional"
              type="email"
              class="field-input"
              placeholder="nombre@uadec.mx"
            />
          </label>

          <label class="field">
            <span class="field-label">Teléfono</span>
            <input
              v-model="form.telefono_contacto"
              class="field-input"
              placeholder="871-000-0000"
            />
          </label>

          <!-- Combo de carreras -->
          <label class="field">
            <span class="field-label">Carrera *</span>
            <select
              v-model.number="form.id_carrera"
              class="field-input"
              required
            >
              <option disabled value="">
                Selecciona una carrera
              </option>
              <option
                v-for="c in carreras"
                :key="c.id_carrera"
                :value="c.id_carrera"
              >
                {{ c.nombre }} ({{ c.duracion_semestres }} semestres)
              </option>
            </select>
            <small v-if="!carreras.length" class="hint">
              No hay carreras cargadas. Ve al módulo de Carreras para crear algunas.
            </small>
          </label>

          <label class="field">
            <span class="field-label">Semestre *</span>
            <input
              v-model.number="form.semestre_actual"
              type="number"
              min="1"
              required
              class="field-input"
            />
          </label>

          <label class="field field-checkbox">
            <input v-model="form.activo" type="checkbox" />
            <span>Activo</span>
          </label>
        </div>

        <div class="form-actions">
          <div class="form-actions-left">
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="loadingCreate"
            >
              <span v-if="loadingCreate">Guardando...</span>
              <span v-else>
                {{ isEditing ? 'Actualizar alumno' : 'Guardar alumno' }}
              </span>
            </button>

            <button
              v-if="isEditing"
              type="button"
              class="btn btn-text"
              @click="onCancelEdit"
            >
              Cancelar edición
            </button>
          </div>

          <div class="form-actions-right">
            <button
              type="button"
              class="btn btn-text"
              @click="downloadTemplate"
            >
              ⬇️ Plantilla Excel
            </button>
            <button
              type="button"
              class="btn btn-outline"
              @click="openBulkModal"
            >
              📤 Carga masiva
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Card listado -->
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
            v-model="search"
            class="search-input"
            placeholder="Buscar por nombre, matrícula o email..."
          />
          <button
            class="btn btn-text"
            @click="loadAlumnos"
            :disabled="loadingList"
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
              :class="{ 'row-editing': al.matricula === editingMatricula }"
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
                  @click="onEdit(al)"
                >
                  ✏️
                </button>
                <button
                  class="icon-button icon-danger"
                  title="Eliminar"
                  @click="onDelete(al.matricula)"
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

    <!-- MODAL CARGA MASIVA -->
    <BaseModal
      v-model="showBulkModal"
      title="Carga masiva de alumnos"
      subtitle="Usa la plantilla Excel para registrar varios alumnos en una sola operación."
      :close-on-backdrop="!bulkLoading"
    >
      <div class="bulk-body">
        <div class="bulk-upload-row">
          <label class="field">
            <span class="field-label">Archivo Excel (.xlsx / .xls)</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              @change="onBulkFileChange"
              :disabled="bulkParsing || bulkLoading"
              class="field-input"
            />
          </label>
          <div v-if="bulkFileName" class="bulk-file-name">
            Archivo seleccionado:
            <strong>{{ bulkFileName }}</strong>
          </div>
        </div>

        <p class="bulk-hint">
          <strong>Formato esperado de columnas:</strong>
          <code>matricula</code>,
          <code>nombre_completo</code>,
          <code>email_institucional</code>,
          <code>telefono_contacto</code>,
          <code>id_carrera</code>,
          <code>semestre_actual</code>,
          <code>activo</code> (opcional).
        </p>

        <div v-if="bulkParsing" class="bulk-status">
          Leyendo archivo...
        </div>

        <div v-if="bulkRows.length" class="bulk-preview">
          <div class="bulk-preview-header">
            <span>
              Registros listos para cargar:
              <strong>{{ bulkRows.length }}</strong>
            </span>
            <span v-if="bulkProgress.total">
              Progreso:
              <strong>
                {{ bulkProgress.processed }} / {{ bulkProgress.total }}
              </strong>
            </span>
          </div>

          <div class="table-wrapper small">
            <table class="table">
              <thead>
                <tr>
                  <th>Matrícula</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>ID Carrera</th>
                  <th>Semestre</th>
                  <th>Activo</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in bulkRows.slice(0, 10)"
                  :key="row.matricula + '-' + idx"
                >
                  <td>{{ row.matricula }}</td>
                  <td>{{ row.nombre_completo }}</td>
                  <td>{{ row.email_institucional }}</td>
                  <td>{{ row.telefono_contacto }}</td>
                  <td>{{ row.id_carrera }}</td>
                  <td>{{ row.semestre_actual }}</td>
                  <td>{{ row.activo ? 'Sí' : 'No' }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="bulkRows.length > 10" class="hint">
              Mostrando solo los primeros 10 registros.
            </p>
          </div>
        </div>

        <p v-if="!bulkParsing && !bulkRows.length" class="empty">
          Aún no hay registros preparados. Usa la plantilla y selecciona un archivo Excel para
          previsualizar los alumnos a crear.
        </p>

        <div v-if="bulkErrors.length" class="bulk-errors">
          <h4>Errores durante la carga</h4>
          <ul>
            <li v-for="(err, i) in bulkErrors" :key="i">
              {{ err }}
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="btn btn-text"
          @click="showBulkModal = false"
          :disabled="bulkLoading"
        >
          Cerrar
        </button>
        <button
          type="button"
          class="btn btn-primary"
          @click="onBulkUpload"
          :disabled="bulkLoading || !bulkRows.length"
        >
          <span v-if="bulkLoading">
            Cargando {{ bulkProgress.processed }} / {{ bulkProgress.total }}...
          </span>
          <span v-else>
            Ejecutar carga masiva
          </span>
        </button>
      </template>
    </BaseModal>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import * as XLSX from 'xlsx';
import BaseModal from '../components/BaseModal.vue';

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

// ---------- Estado principal ----------

const alumnos = ref<Alumno[]>([]);
const carreras = ref<Carrera[]>([]);

const loadingList = ref(false);
const loadingCreate = ref(false);
const loadingCarreras = ref(false);
const error = ref<string | null>(null);

const isEditing = ref(false);
const editingMatricula = ref<string | null>(null);

const search = ref('');

// ---------- Carga masiva (estado) ----------

const showBulkModal = ref(false);
const bulkFileName = ref('');
const bulkParsing = ref(false);
const bulkRows = ref<(AlumnoCreate & { activo: boolean })[]>([]);
const bulkErrors = ref<string[]>([]);
const bulkLoading = ref(false);
const bulkProgress = ref({ processed: 0, total: 0 });

// ---------- Helpers de formulario ----------

const createEmptyForm = (defaultCarreraId: number = 1): AlumnoCreate & { activo: boolean } => ({
  matricula: '',
  nombre_completo: '',
  email_institucional: '',
  telefono_contacto: '',
  id_carrera: defaultCarreraId,
  semestre_actual: 1,
  activo: true,
});

const form = ref<AlumnoCreate & { activo: boolean }>(
  createEmptyForm(),
);

const resetForm = () => {
  const defaultCarreraId = carreras.value[0]?.id_carrera ?? 1;
  form.value = createEmptyForm(defaultCarreraId);
  isEditing.value = false;
  editingMatricula.value = null;
};

// ---------- Computados ----------

const filteredAlumnos = computed(() => {
  if (!search.value.trim()) return alumnos.value;
  const term = search.value.toLowerCase();
  return alumnos.value.filter((a) => {
    return (
      a.matricula.toLowerCase().includes(term) ||
      a.nombre_completo.toLowerCase().includes(term) ||
      (a.email_institucional ?? '').toLowerCase().includes(term)
    );
  });
});

// Helper para mostrar el nombre de la carrera en la tabla
function getCarreraNombre(id: number): string {
  const c = carreras.value.find((c) => c.id_carrera === id);
  return c ? c.nombre : `ID ${id}`;
}

// ---------- Carga de datos ----------

async function loadAlumnos() {
  try {
    error.value = null;
    loadingList.value = true;
    alumnos.value = await getAlumnos();
  } catch (e) {
    console.error(e);
    error.value = 'Error al cargar alumnos';
  } finally {
    loadingList.value = false;
  }
}

async function loadCarreras() {
  try {
    loadingCarreras.value = true;
    const data = await getCarreras();
    carreras.value = data;

    // Ajustar id_carrera por defecto si no coincide con la lista
    if (
      !isEditing.value &&
      carreras.value.length > 0 &&
      !carreras.value.some((c) => c.id_carrera === form.value.id_carrera)
    ) {
      form.value.id_carrera = carreras.value[0].id_carrera;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loadingCarreras.value = false;
  }
}

// ---------- CRUD Alumno (form) ----------

async function onSubmit() {
  try {
    error.value = null;
    loadingCreate.value = true;

    if (isEditing.value && editingMatricula.value) {
      const { matricula, ...payload } = form.value;
      const updated = await updateAlumno(editingMatricula.value, payload);
      alumnos.value = alumnos.value.map((a) =>
        a.matricula === editingMatricula.value ? updated : a,
      );
    } else {
      const created = await createAlumno(form.value);
      alumnos.value.push(created);
    }

    resetForm();
  } catch (e) {
    console.error(e);
    error.value = isEditing.value
      ? 'Error al actualizar alumno'
      : 'Error al crear alumno';
  } finally {
    loadingCreate.value = false;
  }
}

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
}

function onCancelEdit() {
  resetForm();
}

async function onDelete(matricula: string) {
  if (!confirm(`¿Eliminar alumno ${matricula}?`)) return;
  try {
    await deleteAlumno(matricula);
    alumnos.value = alumnos.value.filter((a) => a.matricula !== matricula);
    if (editingMatricula.value === matricula) {
      resetForm();
    }
  } catch (e) {
    console.error(e);
    error.value = 'Error al eliminar alumno';
  }
}

// ---------- DESCARGAR PLANTILLA EXCEL ----------

function downloadTemplate() {
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

// ---------- CARGA MASIVA ----------

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
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

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
        _rowIndex: index + 2, // considerando encabezado en fila 1
      };
    });

    // Validación más estricta / eficaz
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
        'No se encontraron filas válidas después de las validaciones. Verifica que el archivo tenga las columnas requeridas y matrículas no repetidas.',
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

  for (let i = 0; i < bulkRows.value.length; i++) {
    const row = bulkRows.value[i];
    const excelRowNumber = i + 2; // suponiendo encabezados en fila 1

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

// Limpiar estado de carga masiva al cerrar el modal
watch(showBulkModal, (value) => {
  if (!value) {
    resetBulkState();
  }
});

onMounted(async () => {
  await Promise.all([loadAlumnos(), loadCarreras()]);
  // Inicializar form con primera carrera si existe
  if (carreras.value.length) {
    form.value.id_carrera = carreras.value[0].id_carrera;
  }
});
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #202124;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #5f6368;
  margin-top: 0.25rem;
}

.page-header-meta {
  display: flex;
  gap: 0.5rem;
}

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

/* Formulario */

.form {
  margin-top: 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.field-label {
  color: #5f6368;
}

.field-input {
  padding: 0.45rem 0.6rem;
  border-radius: 8px;
  border: 1px solid #dadce0;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  background-color: #ffffff;
}

.field-input:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 1px rgba(26, 115, 232, 0.2);
}

.field-checkbox {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1.4rem;
}

.hint {
  font-size: 0.75rem;
  color: #a0a4a8;
  margin-top: 0.15rem;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.form-actions-left,
.form-actions-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Botones */

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

.btn-primary {
  background: #1a73e8;
  color: #ffffff;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: default;
}

.btn-text {
  background: transparent;
  color: #1a73e8;
}

.btn-text:hover {
  background: rgba(26, 115, 232, 0.08);
}

.btn-outline {
  background: #ffffff;
  color: #1a73e8;
  border: 1px solid #d2e3fc;
}

.btn-outline:hover {
  background: #e8f0fe;
}

/* Search */

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

/* Chips */

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  font-size: 0.78rem;
  border: 1px solid transparent;
}

.chip-soft {
  background: #f1f3f4;
  color: #5f6368;
}

.chip-primary {
  background: #e8f0fe;
  border-color: #d2e3fc;
  color: #1a73e8;
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

/* Tabla */

.table-wrapper {
  margin-top: 0.75rem;
  border-radius: 12px;
  border: 1px solid #dadce0;
  overflow: hidden;
}

.table-wrapper.small {
  max-height: 260px;
  overflow: auto;
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

.row-editing {
  background: #e8f0fe;
}

.col-actions {
  width: 80px;
}

.cell-actions {
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
}

/* Icon buttons */

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

/* Mensajes */

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

/* Carga masiva */

.bulk-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bulk-upload-row {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.bulk-file-name {
  font-size: 0.85rem;
  color: #5f6368;
}

.bulk-hint {
  font-size: 0.8rem;
  color: #5f6368;
}

.bulk-hint code {
  font-family: Consolas, monospace;
  background: #f1f3f4;
  padding: 0.05rem 0.25rem;
  border-radius: 4px;
}

.bulk-status {
  font-size: 0.86rem;
  color: #1a73e8;
}

.bulk-preview {
  margin-top: 0.25rem;
}

.bulk-preview-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #5f6368;
}

.bulk-errors {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fce8e6;
  border-radius: 8px;
  border: 1px solid #f8d7da;
}

.bulk-errors h4 {
  margin: 0 0 0.35rem;
  font-size: 0.9rem;
  color: #b00020;
}

.bulk-errors ul {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.8rem;
  color: #b00020;
}
</style>
