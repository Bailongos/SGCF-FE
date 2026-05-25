<!-- src/views/ObservacionesView.vue -->
<template>
  <section class="page g-page-animate">
    <div class="back-to-home">
      <RouterLink to="/inicio" custom v-slot="{ navigate }">
        <GoogleButton @click="navigate" variant="text" size="sm">
          <span class="material-symbols-outlined">arrow_back</span>
          Volver a inicio
        </GoogleButton>
      </RouterLink>
    </div>

    <header class="page-header">
      <div class="header-content">
        <h2 class="page-title">Observaciones</h2>
        <p class="page-subtitle">Registro de incidencias y notas por alumno.</p>
      </div>

      <div class="page-header-meta">
        <GoogleChip variant="soft">Total: <strong>{{ observaciones.length }}</strong></GoogleChip>
        <GoogleButton variant="filled" size="sm" @click="openCreateForm">
          <span class="material-symbols-outlined">add</span>
          Nueva observación
        </GoogleButton>
      </div>
    </header>

    <FilterBar compact :activeCount="filterActiveCount" @clear="clearFilters">
      <GoogleInput v-model="filters.matricula" placeholder="Todas las matrículas" size="sm" list="alumnos-list-obs" />
      <datalist id="alumnos-list-obs">
        <option v-for="al in alumnos" :key="al.matricula" :value="al.matricula">{{ al.matricula }} · {{ al.nombre_completo }}</option>
      </datalist>

      <GoogleSelect v-model="filters.tipo" :options="tipoSelectOptions" placeholder="Todos los tipos" size="sm" />

      <template #actions>
        <GoogleButton variant="text" size="sm" @click="loadObservaciones">
          <span class="material-symbols-outlined">refresh</span>
          Recargar
        </GoogleButton>
      </template>
    </FilterBar>

    <GoogleTable 
      :rows="tableRows" 
      :columns="columns" 
      rowKey="id_observacion" 
      :loading="loadingList"
      v-model:search="search" 
      title="Bitácora de Observaciones"
      subtitle="Consulta el historial de notas registradas." 
      icon="speaker_notes" 
      :showReload="true"
      :useDefaultActions="true" 
      :searchKeys="['matricula', 'alumno_nombre', 'autor_nombre', 'detalle']"
      @reload="loadObservaciones" 
      @edit="onEdit" 
      @delete="onDelete" 
    />

    <GoogleModal 
      v-model="showFormModal" 
      :icon="isEditing ? 'edit_note' : 'note_add'"
      :title="isEditing ? 'Editar observación' : 'Nueva observación'"
      maxWidth="700px" 
      :confirmLoading="loadingSave"
      :confirmText="isEditing ? 'Guardar' : 'Crear'" 
      @confirm="handleFormSubmit"
    >
      <ObservacionForm 
        v-if="form"
        :form="form"
        :tipoOptions="tipoOptions"
        :alumnos="alumnos"
        :usuarios="usuarios"
        :allowSelectAlumno="!isEditing"
        :currentUsername="getCurrentUsername()"
        :error="formError"
        @submit="handleFormSubmit"
      />
    </GoogleModal>

    <ConfirmModal v-model="showDeleteConfirm" title="Eliminar observación" message="¿Eliminar esta observación?"
      variant="danger" confirmText="Eliminar" @confirm="onDeleteConfirm" />
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';

import GoogleButton from '../components/ui/button.vue';
import GoogleInput from '../components/ui/input.vue';
import GoogleSelect from '../components/ui/select.vue';
import FilterBar from '../components/ui/FilterBar.vue';
import GoogleModal from '../components/modal/modal.vue';
import GoogleTable, { type TableColumn } from '../components/ui/table.vue';
import GoogleChip from '../components/ui/chip.vue';
import ObservacionForm from '../components/dashboard/ObservacionForm.vue';
import ConfirmModal from '../components/modal/ConfirmModal.vue';

import { getObservaciones, getTiposObservacion, createObservacion, updateObservacion, deleteObservacion as deleteAPI, type Observacion } from '../services/observaciones';
import { getAlumnos } from '../services/alumnos';
import { getUsuarios } from '../services/usuarios';

const auth = useAuthStore();
const toast = useToast();
const observaciones = ref<Observacion[]>([]);
const alumnos = ref<any[]>([]);
const usuarios = ref<any[]>([]);
const tipos = ref<any[]>([]);

const loadingList = ref(false);
const loadingSave = ref(false);
const formError = ref<string | null>(null);
const showFormModal = ref(false);
const isEditing = ref(false);
const search = ref('');
const filters = ref({ matricula: '', tipo: '' });
const showDeleteConfirm = ref(false);
const deleteTarget = ref<Observacion | null>(null);
const form = ref<any | null>(null);

const tipoOptions = computed(() => tipos.value.map(t => ({ clave: t.clave, nombre: t.nombre })));
const tipoSelectOptions = computed(() => [
  { value: '', label: 'Todos los tipos' },
  ...tipoOptions.value.map(t => ({ value: t.clave, label: t.nombre })),
]);

const filterActiveCount = computed(() =>
  [filters.value.matricula, filters.value.tipo].filter(v => v !== '' && v !== null && v !== undefined).length
);

function clearFilters() {
  filters.value = { matricula: '', tipo: '' };
  loadObservaciones();
}

watch(filters, () => { loadObservaciones(); }, { deep: true });

const tableRows = computed(() => observaciones.value.map(o => ({
  ...o,
  alumno_nombre: alumnos.value.find(al => al.matricula === o.matricula)?.nombre_completo || o.matricula,
  autor_nombre: usuarios.value.find(u => u.id_usuario === o.id_autor)?.username || 'Sistema',
  tipo_label: tipos.value.find(t => t.clave === o.tipo_clave)?.nombre || o.tipo_clave,
  fecha_fmt: o.fecha ? String(o.fecha).slice(0, 10) : '-'
})));

const columns: TableColumn[] = [
  { key: 'matricula', label: 'Matrícula', width: '120px' },
  { key: 'alumno_nombre', label: 'Alumno' },
  { key: 'autor_nombre', label: 'Autor', width: '140px' },
  { key: 'tipo_label', label: 'Tipo', badge: true },
  { key: 'detalle', label: 'Detalle' },
  { key: 'fecha_fmt', label: 'Fecha', width: '110px' },
];

async function loadData() {
  try {
    const [al, us, tp] = await Promise.all([getAlumnos(), getUsuarios(), getTiposObservacion()]);
    alumnos.value = al; usuarios.value = us; tipos.value = tp;
  } catch (e) { console.error(e); }
}

async function loadObservaciones() {
  loadingList.value = true;
  try {
    observaciones.value = await getObservaciones({
      matricula: filters.value.matricula || undefined,
      tipo: filters.value.tipo || undefined
    });
  } catch (e) { toast.error('No se pudieron cargar las observaciones.'); }
  finally { loadingList.value = false; }
}

function getCurrentUsername() { return auth.user?.username || ''; }

function openCreateForm() {
  isEditing.value = false;
  form.value = { matricula: '', detalle: '', tipo_clave: 'GENERAL', autorTexto: getCurrentUsername() };
  showFormModal.value = true;
}

function onEdit(row: Observacion) {
  isEditing.value = true;
  form.value = { ...row, autorTexto: usuarios.value.find(u => u.id_usuario === row.id_autor)?.username || '' };
  showFormModal.value = true;
}

async function handleFormSubmit() {
  if (!form.value.matricula || !form.value.detalle) { toast.error('Completa los campos obligatorios.'); return; }
  loadingSave.value = true;
  try {
    if (isEditing.value) await updateObservacion(form.value.id_observacion, form.value);
    else await createObservacion(form.value);
    await loadObservaciones();
    showFormModal.value = false;
    toast.success(isEditing.value ? 'Actualizado correctamente.' : 'Creado correctamente.');
  } catch (e) { toast.error('Error al guardar la observación.'); }
  finally { loadingSave.value = false; }
}

function onDelete(row: Observacion) {
  deleteTarget.value = row;
  showDeleteConfirm.value = true;
}

async function onDeleteConfirm() {
  const row = deleteTarget.value;
  if (!row) return;
  try {
    await deleteAPI(row.id_observacion);
    await loadObservaciones();
    toast.success('Eliminado correctamente.');
  } catch (e) { toast.error('Error al eliminar.'); }
  finally {
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
  }
}

onMounted(async () => { await loadData(); await loadObservaciones(); });
</script>

<style scoped>
.page { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; }
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--md-sys-color-on-surface); margin: 0; }
.page-subtitle { color: var(--md-sys-color-on-surface-variant); margin-top: 0.25rem; }
.page-header-meta { display: flex; gap: 1rem; align-items: center; }
@media (max-width: 800px) { .filters-panel { grid-template-columns: 1fr; } }
</style>
