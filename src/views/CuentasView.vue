<!-- src/views/CuentasView.vue -->
<template>
  <section class="page">
    <!-- Botón para volver a Inicio -->
    <div class="back-to-home">
        <RouterLink to="/inicio" custom v-slot="{ navigate }">
            <GoogleButton @click="navigate" color="#1a73e8" label="Volver a Inicio">
                <span class="material-symbols-outlined">arrow_back</span>
            </GoogleButton>
        </RouterLink>
    </div>
    <!-- Header -->
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
      </div>
    </header>

    <!-- Card formulario -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">
            {{ isEditing ? 'Editar cuenta' : 'Nueva cuenta' }}
          </h3>
          <p class="card-subtitle">
            Registra un adeudo por alumno, ciclo y concepto (UADEC / ESCUELA).
          </p>
        </div>
        <span
          v-if="isEditing && form.id_cuenta"
          class="chip chip-primary"
        >
          Editando: #{{ form.id_cuenta }}
        </span>
      </div>

      <form @submit.prevent="onSubmit" class="form">
        <div class="form-grid">
          <!-- Alumno / Matrícula -->
          <label class="field">
            <span class="field-label">Matrícula *</span>
            <input
              v-model="form.matricula"
              list="alumnos-list"
              required
              class="field-input"
              placeholder="Ej. 180054"
            />
            <datalist id="alumnos-list">
              <option
                v-for="al in alumnos"
                :key="al.matricula"
                :value="al.matricula"
              >
                {{ al.matricula }} · {{ al.nombre_completo }}
              </option>
            </datalist>
          </label>

          <!-- Ciclo escolar -->
          <label class="field">
            <span class="field-label">Ciclo escolar *</span>
            <select
              v-model.number="form.id_ciclo"
              class="field-input"
              required
            >
              <option disabled value="">
                Selecciona un ciclo
              </option>
              <option
                v-for="c in ciclos"
                :key="c.id_ciclo"
                :value="c.id_ciclo"
              >
                {{ c.nombre }}
              </option>
            </select>
            <small v-if="!ciclos.length" class="hint">
              No hay ciclos cargados.
            </small>
          </label>

          <!-- Concepto -->
          <label class="field">
            <span class="field-label">Concepto *</span>
            <select
              v-model="form.concepto"
              class="field-input"
              required
            >
              <option value="UADEC">UADEC</option>
              <option value="ESCUELA">ESCUELA</option>
            </select>
          </label>

          <!-- Monto -->
          <label class="field">
            <span class="field-label">Monto *</span>
            <input
              v-model.number="form.monto"
              type="number"
              step="0.01"
              min="0"
              required
              class="field-input"
              placeholder="0.00"
            />
          </label>

          <!-- Pagado -->
          <label class="field field-checkbox">
            <input
              v-model="form.pagado"
              type="checkbox"
            />
            <span>Marcar como pagado</span>
          </label>

          <!-- Fecha de pago -->
          <label class="field">
            <span class="field-label">Fecha de pago</span>
            <input
              v-model="form.fecha_pago"
              type="date"
              class="field-input"
              :disabled="!form.pagado"
            />
          </label>

          <!-- Método de pago -->
          <label class="field">
            <span class="field-label">Método de pago</span>
            <select
              v-model.number="form.id_metodo"
              class="field-input"
              :disabled="!form.pagado"
            >
              <option :value="0">Sin especificar</option>
              <option
                v-for="m in metodos"
                :key="m.id_metodo"
                :value="m.id_metodo"
              >
                {{ m.nombre }}
              </option>
            </select>
            <small v-if="!metodos.length" class="hint">
              No hay métodos de pago cargados.
            </small>
          </label>
        </div>

        <div class="form-actions">
          <div class="form-actions-left">
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="loadingSave"
            >
              <span v-if="loadingSave">Guardando...</span>
              <span v-else>
                {{ isEditing ? 'Actualizar cuenta' : 'Guardar cuenta' }}
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
              @click="loadCuentas"
              :disabled="loadingList"
            >
              Recargar
            </button>
          </div>
        </div>
      </form>

      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <!-- Card listado -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Listado de cuentas</h3>
          <p class="card-subtitle">
            Consulta, edita o elimina adeudos registrados.
          </p>
        </div>
        <div class="card-actions">
          <input
            v-model="search"
            class="search-input"
            placeholder="Buscar por matrícula, alumno o concepto..."
          />
        </div>
      </div>

      <div v-if="filteredCuentas.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Matrícula</th>
              <th>Alumno</th>
              <th>Concepto</th>
              <th>Ciclo</th>
              <th>Monto</th>
              <th>Pagado</th>
              <th>Fecha pago</th>
              <th>Método</th>
              <th class="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="cuenta in filteredCuentas"
              :key="cuenta.id_cuenta"
              :class="{ 'row-editing': cuenta.id_cuenta === form.id_cuenta }"
            >
              <td>#{{ cuenta.id_cuenta }}</td>
              <td>{{ cuenta.matricula }}</td>
              <td>{{ getAlumnoNombre(cuenta.matricula) }}</td>
              <td>{{ cuenta.concepto }}</td>
              <td>{{ getCicloNombre(cuenta.id_ciclo) }}</td>
              <td>{{ formatMoney(cuenta.monto) }}</td>
              <td>
                <span
                  class="chip"
                  :class="cuenta.pagado ? 'chip-success' : 'chip-warning'"
                >
                  {{ cuenta.pagado ? 'PAGADO' : 'PENDIENTE' }}
                </span>
              </td>
              <td>
                {{ formatDate(cuenta.fecha_pago) }}
              </td>
              <td>
                {{ getMetodoNombre(cuenta.id_metodo) }}
              </td>
              <td class="cell-actions">
                <button
                  class="icon-button"
                  title="Editar"
                  @click="onEdit(cuenta)"
                >
                  ✏️
                </button>
                <button
                  class="icon-button icon-danger"
                  title="Eliminar"
                  @click="onDelete(cuenta.id_cuenta)"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="empty">
        No hay cuentas que coincidan con el filtro.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

import GoogleButton from '../components/ui/button.vue';
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

const cuentas = ref<Cuenta[]>([]);
const alumnos = ref<Alumno[]>([]);
const ciclos = ref<Ciclo[]>([]);
const metodos = ref<MetodoPago[]>([]);

const loadingList = ref(false);
const loadingSave = ref(false);
const error = ref<string | null>(null);

const search = ref('');
const isEditing = ref(false);

interface CuentaForm extends CuentaPayload {
  id_cuenta: number | null;
  fecha_pago: string | null;
  id_metodo: number | null;
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

function resetForm() {
  form.value = {
    id_cuenta: null,
    matricula: '',
    concepto: 'UADEC',
    id_ciclo: ciclos.value[0]?.id_ciclo ?? 0,
    monto: 0,
    pagado: false,
    fecha_pago: null,
    id_metodo: 0,
  };
  isEditing.value = false;
}

// Helpers

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

// Computed

const filteredCuentas = computed(() => {
  if (!search.value.trim()) return cuentas.value;
  const term = search.value.toLowerCase();
  return cuentas.value.filter((c) => {
    const alumno = getAlumnoNombre(c.matricula).toLowerCase();
    const metodo = getMetodoNombre(c.id_metodo).toLowerCase();
    return (
      c.matricula.toLowerCase().includes(term) ||
      alumno.includes(term) ||
      c.concepto.toLowerCase().includes(term) ||
      metodo.includes(term)
    );
  });
});

const totalPendiente = computed(() =>
  cuentas.value.reduce(
    (sum, c) => (c.pagado ? sum : sum + (Number(c.monto) || 0)),
    0,
  ),
);

// Loaders

async function loadCatalogos() {
  try {
    console.log('%c[loadCatalogos] Llamando servicios...', 'color: #1a73e8;');

    const [al, ci, mp] = await Promise.all([
      getAlumnos(),
      getCiclos(),
      getMetodosPago(),
    ]);

    // 🔹 IMPRIME LO QUE REGRESA CADA SERVICE
    console.log('[getAlumnos] respuesta:', al);
    console.log('[getCiclos] respuesta:', ci);
    console.log('[getMetodosPago] respuesta:', mp);

    alumnos.value = al;
    ciclos.value = ci;
    metodos.value = mp;

    if (!form.value.id_ciclo && ciclos.value.length) {
      form.value.id_ciclo = ciclos.value[0].id_ciclo;
    }

    console.log('[loadCatalogos] alumnos:', alumnos.value);
    console.log('[loadCatalogos] ciclos:', ciclos.value);
    console.log('[loadCatalogos] metodos:', metodos.value);
  } catch (e) {
    console.error('Error al cargar catálogos', e);
  }
}

async function loadCuentas() {
  try {
    error.value = null;
    loadingList.value = true;
    console.log('%c[loadCuentas] Llamando getCuentas...', 'color: #1a73e8;');
    const resp = await getCuentas();

    // 🔹 IMPRIME LO QUE REGRESA getCuentas
    console.log('[getCuentas] respuesta:', resp);

    cuentas.value = resp;

    console.log('[loadCuentas] cuentas en estado:', cuentas.value);
  } catch (e) {
    console.error('Error en loadCuentas', e);
    error.value = 'Error al cargar cuentas';
  } finally {
    loadingList.value = false;
  }
}

// CRUD

async function onSubmit() {
  try {
    error.value = null;
    loadingSave.value = true;

    const payload: CuentaPayload = {
      matricula: form.value.matricula.trim(),
      concepto: form.value.concepto as ConceptoCuenta,
      id_ciclo: form.value.id_ciclo,
      monto: Number(form.value.monto) || 0,
      pagado: form.value.pagado,
      fecha_pago: form.value.pagado ? form.value.fecha_pago ?? null : null,
      id_metodo:
        form.value.pagado && form.value.id_metodo && form.value.id_metodo !== 0
          ? form.value.id_metodo
          : null,
    };

    console.log('[onSubmit] payload a enviar:', payload);

    if (isEditing.value && form.value.id_cuenta != null) {
      console.log('[onSubmit] updateCuenta id:', form.value.id_cuenta);
      const updated = await updateCuenta(form.value.id_cuenta, payload);
      console.log('[updateCuenta] respuesta:', updated);

      cuentas.value = cuentas.value.map((c) =>
        c.id_cuenta === updated.id_cuenta ? updated : c,
      );
    } else {
      console.log('[onSubmit] createCuenta');
      const created = await createCuenta(payload);
      console.log('[createCuenta] respuesta:', created);

      cuentas.value.push(created);
    }

    console.log('[onSubmit] cuentas después de guardar:', cuentas.value);

    resetForm();
  } catch (e) {
    console.error('[onSubmit] error:', e);
    error.value = isEditing.value
      ? 'Error al actualizar la cuenta'
      : 'Error al crear la cuenta';
  } finally {
    loadingSave.value = false;
  }
}

function onEdit(cuenta: Cuenta) {
  console.log('[onEdit] cuenta seleccionada:', cuenta);

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

  console.log('[onEdit] form cargado:', form.value);
}

function onCancelEdit() {
  console.log('[onCancelEdit] reseteando formulario');
  resetForm();
}

async function onDelete(id_cuenta: number) {
  if (!confirm(`¿Eliminar cuenta #${id_cuenta}?`)) return;
  try {
    console.log('[onDelete] eliminando cuenta:', id_cuenta);
    await deleteCuenta(id_cuenta);
    cuentas.value = cuentas.value.filter((c) => c.id_cuenta !== id_cuenta);

    console.log('[onDelete] cuentas después de eliminar:', cuentas.value);

    if (form.value.id_cuenta === id_cuenta) {
      resetForm();
    }
  } catch (e) {
    console.error('[onDelete] error:', e);
    error.value = 'Error al eliminar la cuenta';
  }
}

onMounted(async () => {
  console.log('%c[CuentasView] onMounted', 'color: purple;');
  await Promise.all([loadCatalogos(), loadCuentas()]);
});
</script>


<style scoped>
/* mismos estilos que ya traías */
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

/* Tabla */

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
</style>
