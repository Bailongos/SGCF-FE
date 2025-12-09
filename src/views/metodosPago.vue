<!-- src/views/MetodosPagoView.vue (o MétodosDePagoView.vue, como lo tengas en el router) -->
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
        <h2 class="page-title">Métodos de pago</h2>
        <p class="page-subtitle">
          Administra los métodos de pago aceptados en caja.
        </p>
      </div>
      <div class="page-header-meta">
        <span class="chip chip-soft">
          Total: <strong>{{ metodos.length }}</strong>
        </span>

        <GoogleButton
          size="sm"
          color="#1a73e8"
          @click="openCreateForm"
        >
          <span class="material-symbols-outlined">add</span>
          Nuevo método
        </GoogleButton>
      </div>
    </header>

    <!-- Tabla genérica googlesca -->
    <GoogleTable
      :rows="metodos"
      :columns="metodosColumns"
      rowKey="id_metodo"
      :loading="loadingList"
      :error="error"
      v-model:search="search"
      title="Listado de métodos de pago"
      subtitle="Edita o elimina métodos existentes. Solo se recomienda eliminar métodos que no tengan movimientos asociados."
      icon="payments"
      :showReload="true"
      :useDefaultActions="true"
      :searchKeys="['nombre']"
      :successMessage="tableSuccessMessage"
      emptyMessage="No hay métodos que coincidan con el filtro."
      @reload="loadMetodos"
      @edit="onEdit"
      @delete="onDelete"
    />

    <!-- Modal Crear / Editar método -->
    <GoogleModal
      v-model="showFormModal"
      :icon="isEditing ? 'edit' : 'payments'"
      :title="isEditing ? 'Editar método de pago' : 'Nuevo método de pago'"
      subtitle="Define nombres claros para identificar fácilmente cada forma de pago (efectivo, tarjeta, transferencia, etc.)."
      maxWidth="520px"
      density="comfortable"
      :confirmLoading="loadingSave"
      :confirmText="isEditing ? 'Actualizar' : 'Guardar'"
      cancelText="Cancelar"
      @confirm="handleFormSubmit"
      @cancel="handleCancelForm"
    >
      <form @submit.prevent="handleFormSubmit" class="metodo-form">
        <div class="metodo-form-grid">
          <GoogleInput
            v-model="form.nombre"
            label="Nombre del método *"
            placeholder="Ej. Efectivo, Tarjeta Débito/Crédito, Transferencia"
            required
          />
        </div>
        <!-- Botones los maneja el footer del modal -->
      </form>
    </GoogleModal>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

import GoogleButton from '../components/ui/button.vue';
import GoogleInput from '../components/ui/input.vue';
import GoogleModal from '../components/modal/modal.vue';
import GoogleTable, { type TableColumn } from '../components/ui/table.vue';

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

// para mensajes de éxito dentro de la tabla (toast interno)
const tableSuccessMessage = ref<string | null>(null);

// Modal formulario
const showFormModal = ref(false);

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

// Columnas para GoogleTable
const metodosColumns: TableColumn[] = [
  { key: 'id_metodo', label: '#', width: '70px', align: 'left' },
  { key: 'nombre', label: 'Nombre' },
];

const filteredMetodos = computed(() => {
  if (!search.value.trim()) return metodos.value;
  const term = search.value.toLowerCase();
  return metodos.value.filter((m) =>
    m.nombre.toLowerCase().includes(term),
  );
});

// Carga de métodos
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

// Abre modal para nuevo método
function openCreateForm() {
  resetForm();
  isEditing.value = false;
  showFormModal.value = true;
}

// Lógica central para guardar/actualizar
async function saveMetodo() {
  try {
    error.value = null;
    loadingSave.value = true;

    const payload: MetodoPagoPayload = {
      nombre: form.value.nombre.trim(),
    };

    if (!payload.nombre) {
      error.value = 'El nombre del método es obligatorio.';
      return;
    }

    if (isEditing.value && editingId.value !== null) {
      const updated = await updateMetodoPago(editingId.value, payload);
      metodos.value = metodos.value.map((m) =>
        m.id_metodo === updated.id_metodo ? updated : m,
      );
      tableSuccessMessage.value = 'Método de pago actualizado correctamente';
    } else {
      const created = await createMetodoPago(payload);
      metodos.value.push(created);
      tableSuccessMessage.value = 'Método de pago creado correctamente';
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

// submit desde el modal (botón footer o Enter en el form)
async function handleFormSubmit() {
  await saveMetodo();
  if (!error.value) {
    showFormModal.value = false;
  }
}

// cancelar desde el modal
function handleCancelForm() {
  resetForm();
  showFormModal.value = false;
}

// Editar desde la tabla (GoogleTable @edit pasa la fila completa)
function onEdit(metodo: MetodoPago) {
  isEditing.value = true;
  editingId.value = metodo.id_metodo;
  form.value = {
    nombre: metodo.nombre,
  };
  showFormModal.value = true;
}

// Eliminar desde la tabla
async function onDelete(row: MetodoPago) {
  const id_metodo = row.id_metodo;
  if (!confirm(`¿Eliminar el método de pago #${id_metodo}?`)) return;
  try {
    await deleteMetodoPago(id_metodo);
    metodos.value = metodos.value.filter((m) => m.id_metodo !== id_metodo);
    if (editingId.value === id_metodo) {
      resetForm();
    }
    tableSuccessMessage.value = 'Método de pago eliminado correctamente';
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

/* Formulario dentro del modal */

.metodo-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.metodo-form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.9rem;
}
</style>
