<!-- src/views/RolesView.vue -->
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
        <h2 class="page-title">Roles de usuario</h2>
        <p class="page-subtitle">
          Administra los perfiles de acceso del sistema (Administrador, Caja, Alumno, etc.).
        </p>
      </div>
      <div class="page-header-meta">
        <span class="chip chip-soft">
          Total: <strong>{{ roles.length }}</strong>
        </span>

        <GoogleButton
          size="sm"
          color="#1a73e8"
          @click="openCreateForm"
        >
          <span class="material-symbols-outlined">add</span>
          Nuevo rol
        </GoogleButton>
      </div>
    </header>

    <!-- Tabla genérica googlesca -->
    <GoogleTable
      :rows="roles"
      :columns="rolesColumns"
      rowKey="id_rol"
      :loading="loadingList"
      :error="error"
      v-model:search="search"
      title="Listado de roles"
      subtitle="Edita o elimina roles existentes. Evita borrar roles asignados a usuarios activos."
      icon="shield_person"
      :showReload="true"
      :useDefaultActions="true"
      :searchKeys="['nombre_rol']"
      :successMessage="tableSuccessMessage"
      emptyMessage="No hay roles que coincidan con el filtro."
      @reload="loadRoles"
      @edit="onEdit"
      @delete="onDelete"
    />

    <!-- Modal Crear / Editar rol -->
    <GoogleModal
      v-model="showFormModal"
      :icon="isEditing ? 'shield_person' : 'group_add'"
      :title="isEditing ? 'Editar rol' : 'Nuevo rol'"
      subtitle="Define los roles que se usarán para asignar permisos a los usuarios."
      maxWidth="600px"
      density="comfortable"
      :confirmLoading="loadingSave"
      :confirmText="isEditing ? 'Actualizar rol' : 'Guardar rol'"
      cancelText="Cancelar"
      @confirm="handleFormSubmit"
      @cancel="handleCancelForm"
    >
      <form @submit.prevent="handleFormSubmit" class="rol-form">
        <div class="rol-form-grid">
          <GoogleInput
            v-model="form.nombre_rol"
            label="Nombre del rol *"
            placeholder="Ej. Administrador, Caja, Alumno"
            required
          />
        </div>
        <!-- Botones los maneja el footer del modal -->
      </form>
    </GoogleModal>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

import GoogleButton from '../components/ui/button.vue';
import GoogleInput from '../components/ui/input.vue';
import GoogleModal from '../components/modal/modal.vue';
import GoogleTable, { type TableColumn } from '../components/ui/table.vue';

import {
  getRoles,
  createRol,
  updateRol,
  deleteRol,
  type Rol,
  type RolPayload,
} from '../services/roles';

const roles = ref<Rol[]>([]);
const loadingList = ref(false);
const loadingSave = ref(false);
const error = ref<string | null>(null);

const isEditing = ref(false);
const editingId = ref<number | null>(null);

const search = ref('');
const tableSuccessMessage = ref<string | null>(null);

// Modal
const showFormModal = ref(false);

const form = ref<RolPayload>({
  nombre_rol: '',
});

function resetForm() {
  form.value = {
    nombre_rol: '',
  };
  isEditing.value = false;
  editingId.value = null;
}

// Columnas para GoogleTable
const rolesColumns: TableColumn[] = [
  { key: 'id_rol', label: '#', width: '70px', align: 'left' },
  { key: 'nombre_rol', label: 'Nombre del rol' },
];

// API

async function loadRoles() {
  try {
    error.value = null;
    loadingList.value = true;
    roles.value = await getRoles();
  } catch (e) {
    console.error(e);
    error.value = 'Error al cargar los roles';
  } finally {
    loadingList.value = false;
  }
}

// Abre modal para nuevo rol
function openCreateForm() {
  resetForm();
  isEditing.value = false;
  showFormModal.value = true;
}

// Lógica central para guardar/actualizar
async function saveRol() {
  try {
    error.value = null;
    loadingSave.value = true;

    const payload: RolPayload = {
      nombre_rol: form.value.nombre_rol.trim(),
    };

    if (!payload.nombre_rol) {
      error.value = 'El nombre del rol es obligatorio.';
      return;
    }

    if (isEditing.value && editingId.value !== null) {
      const updated = await updateRol(editingId.value, payload);
      roles.value = roles.value.map((r) =>
        r.id_rol === updated.id_rol ? updated : r,
      );
      tableSuccessMessage.value = 'Rol actualizado correctamente';
    } else {
      const created = await createRol(payload);
      roles.value.push(created);
      tableSuccessMessage.value = 'Rol creado correctamente';
    }

    resetForm();
  } catch (e: any) {
    console.error(e);
    const backendMsg =
      e?.response?.data?.message ??
      e?.message ??
      'Error desconocido';
    error.value = `No se pudo guardar el rol: ${backendMsg}`;
  } finally {
    loadingSave.value = false;
  }
}

// submit desde el modal
async function handleFormSubmit() {
  await saveRol();
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
function onEdit(row: Rol) {
  isEditing.value = true;
  editingId.value = row.id_rol;
  form.value = {
    nombre_rol: row.nombre_rol,
  };
  showFormModal.value = true;
}

// Eliminar desde la tabla
async function onDelete(row: Rol) {
  const id_rol = row.id_rol;
  if (!confirm(`¿Eliminar el rol #${id_rol}?`)) return;
  try {
    await deleteRol(id_rol);
    roles.value = roles.value.filter((r) => r.id_rol !== id_rol);
    if (editingId.value === id_rol) {
      resetForm();
    }
    tableSuccessMessage.value = 'Rol eliminado correctamente';
  } catch (e: any) {
    console.error(e);
    const backendMsg =
      e?.response?.data?.message ??
      e?.message ??
      'Error desconocido';
    error.value = `No se pudo eliminar el rol: ${backendMsg}`;
  }
}

onMounted(loadRoles);
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

.rol-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rol-form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.9rem 1rem;
}
</style>
