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
        <h2 class="page-title">Métodos de pago</h2>
        <p class="page-subtitle">
          Administra los métodos de pago aceptados en caja.
        </p>
      </div>
      <div class="page-header-meta">
        <span class="chip chip-soft">
          Total: <strong>{{ metodos.length }}</strong>
        </span>
      </div>
    </header>

    <!-- Card formulario -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3 class="card-title">
            {{ isEditing ? 'Editar método de pago' : 'Nuevo método de pago' }}
          </h3>
          <p class="card-subtitle">
            Define nombres claros para identificar fácilmente cada forma de pago
            (efectivo, tarjeta, transferencia, etc.).
          </p>
        </div>
        <span
          v-if="isEditing && editingId !== null"
          class="chip chip-primary"
        >
          Editando: #{{ editingId }}
        </span>
      </div>

      <form @submit.prevent="onSubmit" class="form">
        <div class="form-grid single">
          <label class="field">
            <span class="field-label">Nombre del método *</span>
            <input
              v-model="form.nombre"
              required
              class="field-input"
              placeholder="Ej. Efectivo, Tarjeta Débito/Crédito, Transferencia"
            />
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
                {{ isEditing ? 'Actualizar método' : 'Guardar método' }}
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
              @click="loadMetodos"
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
          <h3 class="card-title">Listado de métodos de pago</h3>
          <p class="card-subtitle">
            Edita o elimina métodos existentes. Solo se recomienda eliminar métodos que no tengan movimientos asociados.
          </p>
        </div>
        <div class="card-actions">
          <input
            v-model="search"
            class="search-input"
            placeholder="Buscar por nombre..."
          />
        </div>
      </div>

      <div v-if="filteredMetodos.length" class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th class="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in filteredMetodos"
              :key="m.id_metodo"
              :class="{ 'row-editing': m.id_metodo === editingId }"
            >
              <td>#{{ m.id_metodo }}</td>
              <td>{{ m.nombre }}</td>
              <td class="cell-actions">
                <button
                  class="icon-button"
                  title="Editar"
                  @click="onEdit(m)"
                >
                  ✏️
                </button>
                <button
                  class="icon-button icon-danger"
                  title="Eliminar"
                  @click="onDelete(m.id_metodo)"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else class="empty">
        No hay métodos que coincidan con el filtro.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  getMetodosPago,
  createMetodoPago,
  updateMetodoPago,
  deleteMetodoPago,
  type MetodoPago,
  type MetodoPagoPayload,
} from '../services/metodo-pago';

const metodos = ref<MetodoPago[]>([]);
const loadingList = ref(false);
const loadingSave = ref(false);
const error = ref<string | null>(null);

const isEditing = ref(false);
const editingId = ref<number | null>(null);
const search = ref('');

const form = ref<MetodoPagoPayload>({
  nombre: '',
});

function resetForm() {
  form.value = {
    nombre: '',
  };
  isEditing.value = false;
  editingId.value = null;
}

const filteredMetodos = computed(() => {
  if (!search.value.trim()) return metodos.value;
  const term = search.value.toLowerCase();
  return metodos.value.filter((m) =>
    m.nombre.toLowerCase().includes(term),
  );
});

async function loadMetodos() {
  try {
    error.value = null;
    loadingList.value = true;
    metodos.value = await getMetodosPago();
  } catch (e) {
    console.error(e);
    error.value = 'Error al cargar los métodos de pago';
  } finally {
    loadingList.value = false;
  }
}

async function onSubmit() {
  try {
    error.value = null;
    loadingSave.value = true;

    if (isEditing.value && editingId.value !== null) {
      const updated = await updateMetodoPago(editingId.value, form.value);
      metodos.value = metodos.value.map((m) =>
        m.id_metodo === updated.id_metodo ? updated : m,
      );
    } else {
      const created = await createMetodoPago(form.value);
      metodos.value.push(created);
    }

    resetForm();
  } catch (e: any) {
    console.error(e);
    const backendMsg =
      e?.response?.data?.message ??
      e?.message ??
      'Error desconocido';
    error.value = `No se pudo guardar el método de pago: ${backendMsg}`;
  } finally {
    loadingSave.value = false;
  }
}

function onEdit(metodo: MetodoPago) {
  isEditing.value = true;
  editingId.value = metodo.id_metodo;
  form.value = {
    nombre: metodo.nombre,
  };
}

function onCancelEdit() {
  resetForm();
}

async function onDelete(id_metodo: number) {
  if (!confirm(`¿Eliminar el método de pago #${id_metodo}?`)) return;
  try {
    await deleteMetodoPago(id_metodo);
    metodos.value = metodos.value.filter((m) => m.id_metodo !== id_metodo);
    if (editingId.value === id_metodo) {
      resetForm();
    }
  } catch (e: any) {
    console.error(e);
    const backendMsg =
      e?.response?.data?.message ??
      e?.message ??
      'Error desconocido';
    error.value = `No se pudo eliminar el método de pago: ${backendMsg}`;
  }
}

onMounted(loadMetodos);
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

.form-grid.single {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
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
