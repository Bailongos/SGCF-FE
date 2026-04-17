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

    <div class="filters-panel">
      <div class="field">
        <span class="field-label">Filtrar por matrícula</span>
        <input v-model="filters.matricula" class="field-input" list="alumnos-list-obs" placeholder="Todas" @change="loadObservaciones" />
        <datalist id="alumnos-list-obs">
          <option v-for="al in alumnos" :key="al.matricula" :value="al.matricula">{{ al.matricula }} · {{ al.nombre_completo }}</option>
        </datalist>
      </div>

      <div class="field">
        <span class="field-label">Tipo</span>
        <select v-model="filters.tipo" class="field-input" @change="loadObservaciones">
          <option value="">Todos</option>
          <option v-for="tipo in tipoOptions" :key="tipo.clave" :value="tipo.clave">{{ tipo.nombre }}</option>
        </select>
      </div>

      <div class="filters-actions">
        <GoogleButton variant="text" @click="resetFilters">Limpiar</GoogleButton>
      </div>
    </div>

    <GoogleTable 
      :rows="tableRows" 
      :columns="columns" 
      rowKey="id_observacion" 
      :loading="loadingList"
      :error="error" 
      v-model:search="search" 
      title="Bitácora de Observaciones"
      subtitle="Consulta el historial de notas registradas." 
      icon="speaker_notes" 
      :showReload="true"
      :useDefaultActions="true" 
      :searchKeys="['matricula', 'alumno_nombre', 'autor_nombre', 'detalle']"
      :successMessage="successMessage" 
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
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import GoogleButton from '../components/ui/button.vue';
import GoogleModal from '../components/modal/modal.vue';
import GoogleTable, { type TableColumn } from '../components/ui/table.vue';
import GoogleChip from '../components/ui/chip.vue';
import ObservacionForm from '../components/dashboard/ObservacionForm.vue';

import { getObservaciones, getTiposObservacion, createObservacion, updateObservacion, deleteObservacion as deleteAPI, type Observacion } from '../services/observaciones';
import { getAlumnos } from '../services/alumnos';
import { getUsuarios } from '../services/usuarios';

const auth = useAuthStore();
const observaciones = ref<Observacion[]>([]);
const alumnos = ref<any[]>([]);
const usuarios = ref<any[]>([]);
const tipos = ref<any[]>([]);

const loadingList = ref(false);
const loadingSave = ref(false);
const error = ref<string | null>(null);
const formError = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const showFormModal = ref(false);
const isEditing = ref(false);
const search = ref('');
const filters = ref({ matricula: '', tipo: '' });
const form = ref<any | null>(null);

const tipoOptions = computed(() => tipos.value.map(t => ({ clave: t.clave, nombre: t.nombre })));
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
  } catch (e) { error.value = 'No se pudieron cargar las observaciones.'; }
  finally { loadingList.value = false; }
}

function resetFilters() { filters.value = { matricula: '', tipo: '' }; loadObservaciones(); }
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
  if (!form.value.matricula || !form.value.detalle) { formError.value = 'Completa los campos obligatorios.'; return; }
  loadingSave.value = true;
  try {
    if (isEditing.value) await updateObservacion(form.value.id_observacion, form.value);
    else await createObservacion(form.value);
    await loadObservaciones();
    showFormModal.value = false;
    successMessage.value = isEditing.value ? 'Actualizado correctamente.' : 'Creado correctamente.';
  } catch (e) { formError.value = 'Error al guardar la observación.'; }
  finally { loadingSave.value = false; }
}

async function onDelete(row: Observacion) {
  if (!confirm('¿Eliminar esta observación?')) return;
  try {
    await deleteAPI(row.id_observacion);
    await loadObservaciones();
    successMessage.value = 'Eliminado correctamente.';
  } catch (e) { error.value = 'Error al eliminar.'; }
}

onMounted(async () => { await loadData(); await loadObservaciones(); });
</script>

<style scoped>
.page { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; }
.page-title { font-size: 1.75rem; font-weight: 700; color: var(--md-sys-color-on-surface); margin: 0; }
.page-subtitle { color: var(--md-sys-color-on-surface-variant); margin-top: 0.25rem; }
.page-header-meta { display: flex; gap: 1rem; align-items: center; }
.filters-panel {
  display: grid; grid-template-columns: 1fr 1fr auto; gap: 1rem; align-items: end;
  padding: 1rem; border-radius: 12px; background: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);
}
.field-label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.4rem; }
.field-input { 
  width: 100%; padding: 0.65rem; border-radius: 8px; border: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface);
}
@media (max-width: 800px) { .filters-panel { grid-template-columns: 1fr; } }
</style>
