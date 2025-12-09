<!-- src/views/CuentasView.vue -->
<template>
  <section class="page g-page-animate">
    <!-- Botón para volver a Inicio -->
    <div class="back-to-home">
      <RouterLink to="/inicio" custom v-slot="{ navigate }">
        <GoogleButton @click="navigate" color="#1a73e8" size="sm">
          <span class="material-symbols-outlined">arrow_back</span>
          Volver a inicio
        </GoogleButton>
      </RouterLink>
    </div>

    <!-- Header estilo Google -->
    <header class="page-header">
      <div>
        <h2 class="page-title">Cuentas por cobrar</h2>
        <p class="page-subtitle">
          Control de adeudos por alumno, concepto y ciclo escolar.
        </p>
      </div>

      <div class="page-header-meta">
        <span class="chip chip-soft">
          Cuentas: <strong>{{ cuentas.length }}</strong>
        </span>
        <span class="chip chip-soft">
          Total pendiente:
          <strong>{{ formatMoney(totalPendiente) }}</strong>
        </span>

        <GoogleButton size="sm" color="#1a73e8" @click="openCreateForm">
          <span class="material-symbols-outlined">add</span>
          Nueva cuenta
        </GoogleButton>
      </div>
    </header>

    <!-- Tabla genérica googlesca -->
    <GoogleTable :rows="cuentas" :columns="cuentasColumns" rowKey="id_cuenta" :loading="loadingList" :error="error"
      v-model:search="search" title="Listado de cuentas" subtitle="Consulta, edita o elimina adeudos registrados."
      icon="request_quote" :showReload="true" :useDefaultActions="true" :searchKeys="['matricula', 'concepto']"
      :successMessage="tableSuccessMessage" emptyMessage="No hay cuentas que coincidan con el filtro."
      @reload="loadCuentas" @edit="onEdit" @delete="onDelete" />

    <!-- Modal Crear / Editar cuenta -->
    <GoogleModal v-model="showFormModal" :icon="isEditing ? 'edit' : 'request_quote'"
      :title="isEditing ? 'Editar cuenta' : 'Nueva cuenta'"
      subtitle="Registra un adeudo por alumno, ciclo y concepto (UADEC / ESCUELA)." maxWidth="760px"
      density="comfortable" :confirmLoading="loadingSave" :confirmText="isEditing ? 'Actualizar' : 'Guardar'"
      cancelText="Cancelar" @confirm="handleFormSubmit" @cancel="handleCancelForm">
      <form @submit.prevent="handleFormSubmit" class="cuenta-form">
        <div class="cuenta-form-grid">
          <!-- Alumno / Matrícula -->
          <GoogleSelect v-model="form.matricula" :options="alumnoOptions" label="Alumno / matrícula *"
            placeholder="Selecciona un alumno..." size="md" />

          <!-- Ciclo escolar -->
          <GoogleSelect v-model="form.id_ciclo" :options="cicloOptions" label="Ciclo escolar *"
            placeholder="Selecciona un ciclo..." size="md" />
          <p v-if="!ciclos.length" class="hint span-2">
            No hay ciclos cargados.
          </p>

          <!-- Concepto -->
          <GoogleSelect v-model="form.concepto" :options="conceptoOptions" label="Concepto *"
            placeholder="Selecciona un concepto..." size="md" />

          <!-- Monto -->
          <GoogleInput v-model="form.monto" label="Monto *" type="number" step="0.01" min="0" placeholder="0.00"
            required />

          <!-- Pagado -->
          <label class="field-checkbox span-2">
            <input v-model="form.pagado" type="checkbox" />
            <span>Marcar como pagado</span>
          </label>

          <!-- Fecha de pago -->
          <GoogleInput v-model="form.fecha_pago" label="Fecha de pago" type="date" :disabled="!form.pagado" />

          <!-- Método de pago -->
          <GoogleSelect v-model="form.id_metodo" :options="metodoOptions" label="Método de pago"
            placeholder="Selecciona un método..." size="md" :disabled="!form.pagado" />
          <p v-if="!metodos.length" class="hint span-2">
            No hay métodos de pago cargados.
          </p>
        </div>

        <p class="cuenta-hint">
          Marca la cuenta como <strong>pagada</strong> para registrar fecha y método de pago.
          Si no se especifica método, se guardará como <strong>sin especificar</strong>.
        </p>
      </form>
    </GoogleModal>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { RouterLink } from 'vue-router';

import GoogleButton from '../components/ui/button.vue';
import GoogleInput from '../components/ui/input.vue';
import GoogleModal from '../components/modal/modal.vue';
import GoogleTable, { type TableColumn } from '../components/ui/table.vue';
import GoogleSelect, { type SelectOption } from '../components/ui/select.vue';

import {
  getCuentas,
  createCuenta,
  updateCuenta,
  deleteCuenta,
  type Cuenta,
  type CuentaPayload,
  type ConceptoCuenta,
} from '../services/cuentas';
import { getAlumnos, type Alumno } from '../services/alumnos';
import { getCiclos, type Ciclo } from '../services/ciclos';
import {
  getMetodosPago,
  type MetodoPago,
} from '../services/metodo-pago';

// ---- STATE ----
const cuentas = ref<Cuenta[]>([]);
const alumnos = ref<Alumno[]>([]);
const ciclos = ref<Ciclo[]>([]);
const metodos = ref<MetodoPago[]>([]);

const loadingList = ref(false);
const loadingSave = ref(false);
const error = ref<string | null>(null);

const search = ref('');
const isEditing = ref(false);

// para mostrar mensajes de éxito dentro de la tabla
const tableSuccessMessage = ref<string | null>(null);

// Modal formulario
const showFormModal = ref(false);

interface CuentaForm extends CuentaPayload {
  id_cuenta: number | null;
  fecha_pago: string | null;
  id_metodo: number | null | 0;
}

const form = ref<CuentaForm>({
  id_cuenta: null,
  matricula: '',
  concepto: 'UADEC',
  id_ciclo: 0,
  monto: 0,
  pagado: false,
  fecha_pago: null,
  id_metodo: 0, // 0 = “sin especificar”
});

// ---- OPTIONS PARA SELECTS ----
const alumnoOptions = computed<SelectOption[]>(() =>
  alumnos.value.map((al) => ({
    value: al.matricula,
    label: `${al.matricula} · ${al.nombre_completo}`,
  })),
);

const cicloOptions = computed<SelectOption[]>(() =>
  ciclos.value.map((c) => ({
    value: c.id_ciclo,
    label: c.nombre,
  })),
);

const conceptoOptions: SelectOption[] = [
  { value: 'UADEC', label: 'UADEC' },
  { value: 'ESCUELA', label: 'ESCUELA' },
];

const metodoOptions = computed<SelectOption[]>(() => [
  { value: 0, label: 'Sin especificar' },
  ...metodos.value.map((m) => ({
    value: m.id_metodo,
    label: m.nombre,
  })),
]);

// ---- HELPERS ----
function resetForm() {
  const firstCiclo = ciclos.value.length > 0 ? ciclos.value[0] : null;

  form.value = {
    id_cuenta: null,
    matricula: '',
    concepto: 'UADEC',
    id_ciclo: firstCiclo ? firstCiclo.id_ciclo : 0,
    monto: 0,
    pagado: false,
    fecha_pago: null,
    id_metodo: 0,
  };
  isEditing.value = false;
}


function formatMoney(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return n.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  return iso;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function getAlumnoNombre(matricula: string): string {
  const al = alumnos.value.find((a) => a.matricula === matricula);
  return al ? al.nombre_completo : '';
}

function getCicloNombre(id_ciclo: number): string {
  const c = ciclos.value.find((c) => c.id_ciclo === id_ciclo);
  return c ? c.nombre : `ID ${id_ciclo}`;
}

function getMetodoNombre(id_metodo: number | null | undefined): string {
  if (!id_metodo) return '';
  const m = metodos.value.find((m) => m.id_metodo === id_metodo);
  return m ? m.nombre : `ID ${id_metodo}`;
}

// Si se desmarca pagado, borramos fecha de pago y método
watch(
  () => form.value.pagado,
  (pagado) => {
    if (!pagado) {
      form.value.fecha_pago = null;
      form.value.id_metodo = 0;
    } else if (!form.value.fecha_pago) {
      form.value.fecha_pago = new Date().toISOString().slice(0, 10);
    }
  },
);

// Totales
const totalPendiente = computed(() =>
  cuentas.value.reduce(
    (sum, c) => (c.pagado ? sum : sum + (Number(c.monto) || 0)),
    0,
  ),
);

// Columnas para GoogleTable
const cuentasColumns: TableColumn[] = [
  { key: 'id_cuenta', label: '#', width: '70px' },
  { key: 'matricula', label: 'Matrícula', width: '110px' },
  {
    key: 'alumno',
    label: 'Alumno',
    formatter: (row: Cuenta) => getAlumnoNombre(row.matricula),
  },
  { key: 'concepto', label: 'Concepto', width: '110px' },
  {
    key: 'ciclo',
    label: 'Ciclo',
    formatter: (row: Cuenta) => getCicloNombre(row.id_ciclo),
  },
  {
    key: 'monto',
    label: 'Monto',
    align: 'right',
    formatter: (row: Cuenta) => formatMoney(row.monto),
  },
  {
    key: 'pagado',
    label: 'Estado',
    width: '110px',
    formatter: (row: Cuenta) => (row.pagado ? 'Pagado' : 'Pendiente'),
  },
  {
    key: 'fecha_pago',
    label: 'Fecha pago',
    width: '120px',
    formatter: (row: Cuenta) => formatDate(row.fecha_pago),
  },
  {
    key: 'metodo',
    label: 'Método',
    formatter: (row: Cuenta) => getMetodoNombre(row.id_metodo),
  },
];

// ---- LOADERS ----
async function loadCatalogos() {
  try {
    const [al, ci, mp] = await Promise.all([
      getAlumnos(),
      getCiclos(),
      getMetodosPago(),
    ]);

    alumnos.value = al;
    ciclos.value = ci;
    metodos.value = mp;

    if (!form.value.id_ciclo && ciclos.value.length > 0) {
      const firstCiclo = ciclos.value[0];
      if (firstCiclo) {
        form.value.id_ciclo = firstCiclo.id_ciclo;
      }
    }

  } catch (e) {
    console.error('Error al cargar catálogos', e);
  }
}

async function loadCuentas() {
  try {
    error.value = null;
    loadingList.value = true;
    const resp = await getCuentas();
    cuentas.value = resp;
  } catch (e) {
    console.error('Error al cargar cuentas', e);
    error.value = 'Error al cargar cuentas';
  } finally {
    loadingList.value = false;
  }
}

// ---- CRUD ----

// Abre modal para nueva cuenta
function openCreateForm() {
  resetForm();
  isEditing.value = false;
  showFormModal.value = true;
}

// Lógica central para guardar/actualizar
async function saveCuenta() {
  try {
    error.value = null;
    tableSuccessMessage.value = null;
    loadingSave.value = true;

    const payload: CuentaPayload = {
      matricula: (form.value.matricula ?? '').toString().trim(),
      concepto: form.value.concepto as ConceptoCuenta,
      id_ciclo: Number(form.value.id_ciclo) || 0,
      monto: Number(form.value.monto) || 0,
      pagado: form.value.pagado,
      fecha_pago: form.value.pagado ? form.value.fecha_pago ?? null : null,
      id_metodo:
        form.value.pagado &&
          form.value.id_metodo &&
          form.value.id_metodo !== 0
          ? Number(form.value.id_metodo)
          : null,
    };

    if (!payload.matricula || !payload.id_ciclo) {
      error.value =
        'La matrícula y el ciclo escolar son obligatorios.';
      return;
    }

    if (isEditing.value && form.value.id_cuenta != null) {
      const updated = await updateCuenta(form.value.id_cuenta, payload);
      cuentas.value = cuentas.value.map((c) =>
        c.id_cuenta === updated.id_cuenta ? updated : c,
      );
      tableSuccessMessage.value = 'Cuenta actualizada correctamente';
    } else {
      const created = await createCuenta(payload);
      cuentas.value.push(created);
      tableSuccessMessage.value = 'Cuenta creada correctamente';
    }

    resetForm();
  } catch (e) {
    console.error('Error al guardar cuenta', e);
    error.value = isEditing.value
      ? 'Error al actualizar la cuenta'
      : 'Error al crear la cuenta';
  } finally {
    loadingSave.value = false;
  }
}

// submit desde el modal
async function handleFormSubmit() {
  await saveCuenta();
  if (!error.value) {
    showFormModal.value = false;
  }
}

// cancelar desde el modal
function handleCancelForm() {
  resetForm();
  showFormModal.value = false;
}

// Editar desde la tabla
function onEdit(cuenta: Cuenta) {
  isEditing.value = true;
  form.value = {
    id_cuenta: cuenta.id_cuenta,
    matricula: cuenta.matricula,
    concepto: cuenta.concepto,
    id_ciclo: cuenta.id_ciclo,
    monto: cuenta.monto,
    pagado: cuenta.pagado,
    fecha_pago: cuenta.fecha_pago
      ? toDateInputValue(cuenta.fecha_pago)
      : null,
    id_metodo: cuenta.id_metodo ?? 0,
  };
  showFormModal.value = true;
}

// Eliminar desde la tabla
async function onDelete(row: Cuenta) {
  const id_cuenta = row.id_cuenta;
  if (!confirm(`¿Eliminar cuenta #${id_cuenta}?`)) return;
  try {
    await deleteCuenta(id_cuenta);
    cuentas.value = cuentas.value.filter(
      (c) => c.id_cuenta !== id_cuenta,
    );
    if (form.value.id_cuenta === id_cuenta) {
      resetForm();
    }
    tableSuccessMessage.value = 'Cuenta eliminada correctamente';
  } catch (e) {
    console.error('Error al eliminar cuenta', e);
    error.value = 'Error al eliminar la cuenta';
  }
}

onMounted(async () => {
  await Promise.all([loadCatalogos(), loadCuentas()]);
});
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

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
  align-items: center;
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

.chip-warning {
  background: #fef7e0;
  border-color: #fbc02d;
  color: #8d6e00;
}

.chip-muted {
  background: #f1f3f4;
  border-color: #e0e0e0;
  color: #5f6368;
}

/* Formulario dentro del modal */

.cuenta-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cuenta-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem 1rem;
  margin-top: 0.25rem;
}

.span-2 {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .cuenta-form-grid {
    grid-template-columns: 1fr;
  }

  .span-2 {
    grid-column: span 1;
  }
}

.field-checkbox {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.25rem;
  font-size: 0.9rem;
  color: #5f6368;
}

.hint {
  font-size: 0.75rem;
  color: #a0a4a8;
  margin-top: 0.1rem;
}

.cuenta-hint {
  font-size: 0.8rem;
  color: #80868b;
  margin-top: 0.25rem;
}
</style>
