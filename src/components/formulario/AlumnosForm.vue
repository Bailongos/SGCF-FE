<!-- src/components/alumnos/AlumnosForm.vue -->
<template>
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
        <!-- Matrícula -->
        <GoogleInput
          v-model="form.matricula"
          label="Matrícula *"
          placeholder="Ej. 190123"
          :disabled="isEditing"
          required
        />

        <!-- Nombre completo -->
        <GoogleInput
          v-model="form.nombre_completo"
          label="Nombre completo *"
          placeholder="Nombre y apellidos"
          required
        />

        <!-- Email institucional -->
        <GoogleInput
          v-model="form.email_institucional"
          label="Email institucional"
          type="email"
          placeholder="nombre@uadec.mx"
        />

        <!-- Teléfono -->
        <GoogleInput
          v-model="form.telefono_contacto"
          label="Teléfono"
          placeholder="871-000-0000"
        />

        <!-- Carrera (select googlesco) -->
        <GoogleSelect
          v-model="form.id_carrera"
          label="Carrera *"
          :options="carreraOptions"
          placeholder="Selecciona una carrera"
          :searchable="true"
          required
        />
        <small
          v-if="!carreras.length"
          class="hint"
        >
          No hay carreras cargadas. Ve al módulo de Carreras para crear algunas.
        </small>

        <!-- Semestre -->
        <GoogleInput
          v-model="form.semestre_actual"
          label="Semestre *"
          type="number"
          min="1"
          required
        />

        <!-- Activo -->
        <label class="field field-checkbox">
          <input v-model="form.activo" type="checkbox" />
          <span>Activo</span>
        </label>
      </div>

      <div class="form-actions">
        <div class="form-actions-left">
          <GoogleButton
            type="submit"
            :loading="loading"
            :disabled="loading"
          >
            <span v-if="isEditing">Actualizar alumno</span>
            <span v-else>Guardar alumno</span>
          </GoogleButton>

          <GoogleButton
            v-if="isEditing"
            type="button"
            variant="text"
            color="#1a73e8"
            @click="onCancelClick"
          >
            Cancelar edición
          </GoogleButton>
        </div>

        <div class="form-actions-right">
          <GoogleButton
            type="button"
            variant="text"
            @click="emit('download-template')"
          >
            ⬇️ Plantilla Excel
          </GoogleButton>

          <GoogleButton
            type="button"
            variant="outlined"
            @click="emit('open-bulk-modal')"
          >
            📤 Carga masiva
          </GoogleButton>
        </div>
      </div>
    </form>

    <!-- Toast de éxito -->
    <GoogleToast
      v-model="toastVisible"
      :message="toastMessage"
      type="success"
    />

    <!-- Confirm para cancelar edición -->
    <GoogleConfirmDialog
      v-model="confirmVisible"
      type="danger"
      title="¿Cancelar edición?"
      message="Los cambios no guardados en el alumno se perderán."
      confirmText="Sí, cancelar"
      cancelText="Seguir editando"
      @confirm="confirmCancelEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AlumnoCreate } from '../../services/alumnos';
import type { Carrera } from '../../services/carreras';

// 🧩 UI “googlesca”
import GoogleInput from '../ui/input.vue';
import GoogleSelect from '../ui/select.vue';
import GoogleButton from '../ui/button.vue';
import GoogleToast from '../modal/toast.vue';
import GoogleConfirmDialog from '../modal/alert.vue';

type AlumnoFormModel = AlumnoCreate & { activo: boolean };

const props = defineProps<{
  form: AlumnoFormModel;
  carreras: Carrera[];
  isEditing: boolean;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit'): void;
  (e: 'cancel-edit'): void;
  (e: 'download-template'): void;
  (e: 'open-bulk-modal'): void;
}>();

// Options para el GoogleSelect
const carreraOptions = computed(() =>
  props.carreras.map((c) => ({
    value: c.id_carrera,
    label: `${c.nombre} (${c.duracion_semestres} semestres)`,
  })),
);

// Toast
const toastVisible = ref(false);
const toastMessage = ref('Alumno guardado con éxito');

// Confirm dialog para cancelar edición
const confirmVisible = ref(false);

function onSubmit() {
  emit('submit');
  // Si quieres mostrar el toast siempre que se dispara submit:
  toastVisible.value = true;
}

function onCancelClick() {
  confirmVisible.value = true;
}

function confirmCancelEdit() {
  confirmVisible.value = false;
  emit('cancel-edit');
}
</script>

<style scoped>
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

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  font-size: 0.78rem;
  border: 1px solid transparent;
}

.chip-primary {
  background: #e8f0fe;
  border-color: #d2e3fc;
  color: #1a73e8;
}
</style>
