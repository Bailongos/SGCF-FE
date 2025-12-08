<!-- src/views/AlumnosView.vue -->
<template>
    <section class="page">
        <!-- Botón para volver a Inicio -->
        <div class="back-to-home">
            <RouterLink to="/inicio" class="btn btn-secondary">
                <span class="material-symbols-outlined">arrow_back</span>
                Volver a Inicio
            </RouterLink>
        </div>
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

        <AlumnosForm :form="form" :carreras="carreras" :is-editing="isEditing" :loading="loadingCreate"
            @submit="onSubmit" @cancel-edit="onCancelEdit" @download-template="downloadTemplate"
            @open-bulk-modal="showBulkModal = true" />

        <AlumnosTable :alumnos="alumnos" :carreras="carreras" :loading="loadingList" :error="error"
            v-model:search="search" @reload="loadAlumnos" @edit="onEdit" @delete="onDelete" />


        <!-- Modal carga masiva -->
        <AlumnosBulkModal v-model="showBulkModal" :file-name="bulkFileName" :rows="bulkRows" :errors="bulkErrors"
            :parsing="bulkParsing" :loading="bulkLoading" :progress="bulkProgress" @file-change="onBulkFileChange"
            @upload="onBulkUpload" />
    </section>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as XLSX from 'xlsx';

import AlumnosForm from '../components/formulario/AlumnosForm.vue';
import AlumnosTable from '../components/formulario/AlumnosTable.vue';
import AlumnosBulkModal from '../components/modal/AlumnosBulkModal.vue';

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

// ---------- Carga masiva ----------
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
    id_carrera: null as any,
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

// ---------- Utilidades ----------
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

  } catch (e) {
    console.error(e);
  } finally {
    loadingCarreras.value = false;
  }
}


// ---------- CRUD Alumno ----------
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

// ---------- Plantilla Excel ----------
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

    for (let i = 0; i < bulkRows.value.length; i++) {
        const row = bulkRows.value[i];
        const excelRowNumber = i + 2;

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

// Limpiar estado al cerrar el modal
watch(showBulkModal, (value) => {
    if (!value) {
        resetBulkState();
    }
});

onMounted(async () => {
    await Promise.all([loadAlumnos(), loadCarreras()]);
    // if (carreras.value.length) {
    //     form.value.id_carrera = carreras.value[0].id_carrera;
    // }
});
</script>

<style scoped>
/* mismos estilos de page, header, chips, etc. que ya tenías */
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
</style>
