<!-- src/views/ConceptosView.vue -->
<template>
  <section class="page">
    <!-- Botón para volver a Inicio -->
    <div class="back-to-home">
        <RouterLink to="/inicio" class="btn btn-secondary">
            <span class="material-symbols-outlined">arrow_back</span>
            Volver a Inicio
        </RouterLink>
    </div>
    <header class="page-header">
      <div>
        <h2 class="page-title">Conceptos de pago</h2>
        <p class="page-subtitle">
          Catálogo de conceptos, clave, monto base y generación automática de cuentas.
        </p>
      </div>

      <div class="page-header-meta">
        <span class="chip chip-soft">
          Conceptos: <strong>{{ conceptos.length }}</strong>
        </span>
        <span class="chip chip-soft">
          Generan cuenta:
          <strong>{{ totalGeneranCuenta }}</strong>
        </span>
      </div>
    </header>

    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">
            {{ isEditing ? 'Editar concepto' : 'Nuevo concepto' }}
          </h3>
          <p class="card-subtitle">
            Define la clave, descripción, monto base y si el concepto genera cuenta automáticamente.
          </p>
        </div>
        <span
          v-if="isEditing && form.clave"
          class="chip chip-primary"
        >
          Editando: {{ form.clave }}
        </span>
      </div>

      <form @submit.prevent="onSubmit" class="form">
        <div class="form-grid">
          <label class="field">
            <span class="field-label">Clave *</span>
            <input
              v-model.trim="form.clave"
              required
              class="field-input"
              placeholder="Ej. UADEC, ESCUELA"
              :disabled="isEditing"
            />
          </label>

          <label class="field">
            <span class="field-label">Descripción *</span>
            <input
              v-model.trim="form.descripcion"
              required
              class="field-input"
              placeholder="Ej. Colegiatura UADEC"
            />
          </label>

          <label class="field">
            <span class="field-label">Monto base *</span>
            <input
              v-model.number="form.monto_default"
              type="number"
              step="0.01"
              min="0"
              required
              class="field-input"
              placeholder="0.00"
            />
          </label>

          <label class="field field-checkbox">
            <input
              v-model="form.genera_cuenta_default"
              type="checkbox"
            />
            <span>Generar cuenta automáticamente por este concepto</span>
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
                {{ isEditing ? 'Actualizar concepto' : 'Guardar concepto' }}
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
              @click="loadConceptos"
              :disabled="loadingList"
            >
              Recargar
            </button>
          </div>
        </div>
      </form>

      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Listado de conceptos</h3>
          <p class="card-subtitle">
            Consulta, edita o elimina conceptos de pago.
          </p>
        </div>
        <div class="card-actions">
          <input
            v-model="search"
            class="search-input"
            placeholder="Buscar por clave o descripción..."
          />
        </div>
      </div>

      <div v-if="filteredConceptos.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Clave</th>
              <th>Descripción</th>
              <th>Monto base</th>
              <th>Genera cuenta</th>
              <th class="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in filteredConceptos"
              :key="c.clave"
              :class="{ 'row-editing': c.clave === form.clave }"
            >
              <td>{{ c.clave }}</td>
              <td>{{ c.descripcion }}</td>
              <td>{{ formatMoney(c.monto_default) }}</td>
              <td>
                <span
                  class="chip"
                  :class="c.genera_cuenta_default ? 'chip-success' : 'chip-muted'"
                >
                  {{ c.genera_cuenta_default ? 'SÍ' : 'NO' }}
                </span>
              </td>
              <td class="cell-actions">
                <button
                  class="icon-button"
                  title="Editar"
                  @click="onEdit(c)"
                >
                  ✏️
                </button>
                <button
                  class="icon-button icon-danger"
                  title="Eliminar"
                  @click="onDelete(c.clave)"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="empty">
        No hay conceptos que coincidan con el filtro.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  getConceptos,
  createConcepto,
  updateConcepto,
  deleteConcepto,
  type Concepto,
  type ConceptoPayload,
} from '../services/conceptos';

const conceptos = ref<Concepto[]>([]);

const loadingList = ref(false);
const loadingSave = ref(false);
const error = ref<string | null>(null);

const search = ref('');
const isEditing = ref(false);

type ConceptoForm = ConceptoPayload;

const form = ref<ConceptoForm>({
  clave: '',
  descripcion: '',
  monto_default: 0,
  genera_cuenta_default: false,
});

function resetForm() {
  form.value = {
    clave: '',
    descripcion: '',
    monto_default: 0,
    genera_cuenta_default: false,
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

const filteredConceptos = computed(() => {
  if (!search.value.trim()) return conceptos.value;
  const term = search.value.toLowerCase();
  return conceptos.value.filter((c) =>
    c.descripcion.toLowerCase().includes(term) ||
    c.clave.toLowerCase().includes(term),
  );
});

const totalGeneranCuenta = computed(
  () => conceptos.value.filter((c) => c.genera_cuenta_default).length,
);

async function loadConceptos() {
  try {
    error.value = null;
    loadingList.value = true;
    const resp = await getConceptos();
    conceptos.value = resp;
  } catch (e) {
    console.error('[ConceptosView] Error al cargar conceptos', e);
    error.value = 'Error al cargar conceptos';
  } finally {
    loadingList.value = false;
  }
}

async function onSubmit() {
  try {
    error.value = null;
    loadingSave.value = true;

    const payload: ConceptoPayload = {
      clave: form.value.clave.trim(),
      descripcion: form.value.descripcion.trim(),
      monto_default: Number(form.value.monto_default) || 0,
      genera_cuenta_default: form.value.genera_cuenta_default,
    };

    if (!payload.clave || !payload.descripcion) {
      error.value = 'La clave y la descripción son obligatorias.';
      return;
    }

    if (isEditing.value) {
      const updated = await updateConcepto(payload.clave, payload);
      conceptos.value = conceptos.value.map((c) =>
        c.clave === updated.clave ? updated : c,
      );
    } else {
      const created = await createConcepto(payload);
      conceptos.value.push(created);
    }

    resetForm();
  } catch (e) {
    console.error('[ConceptosView] Error al guardar concepto', e);
    error.value = isEditing.value
      ? 'Error al actualizar el concepto'
      : 'Error al crear el concepto';
  } finally {
    loadingSave.value = false;
  }
}

function onEdit(concepto: Concepto) {
  isEditing.value = true;
  form.value = {
    clave: concepto.clave,
    descripcion: concepto.descripcion,
    monto_default: concepto.monto_default,
    genera_cuenta_default: concepto.genera_cuenta_default,
  };
}

function onCancelEdit() {
  resetForm();
}

async function onDelete(clave: string) {
  if (!confirm(`¿Eliminar concepto ${clave}?`)) return;
  try {
    await deleteConcepto(clave);
    conceptos.value = conceptos.value.filter(
      (c) => c.clave !== clave,
    );
    if (form.value.clave === clave) {
      resetForm();
    }
  } catch (e) {
    console.error('[ConceptosView] Error al eliminar concepto', e);
    error.value = 'Error al eliminar el concepto';
  }
}

onMounted(async () => {
  await loadConceptos();
});
</script>

<style scoped>
/* mismos estilos base que en CuentasView */

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
