<!-- src/components/alumnos/AlumnosForm.vue -->
<template>
  <GenericForm
    :title="isEditing ? 'Editar alumno' : 'Nuevo alumno'"
    :subtitle="formSubtitle"
    :submit-label="isEditing ? 'Actualizar alumno' : 'Guardar alumno'"
    cancel-label="Cancelar edición"
    :show-cancel="isEditing"
    :submitting="loading"
    @submit="onSubmitWrapper"
    @cancel="onCancelWrapper"
    class="alumnos-form"
  >
    <!-- Chip "Editando" en el header derecho -->
    <template #header-right>
      <span
        v-if="isEditing && form.matricula"
        class="chip chip-primary"
      >
        Editando: {{ form.matricula }}
      </span>
    </template>

    <!-- 👇 Campos del formulario (slot por defecto del GenericForm) -->

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

    <!-- Acciones extra a la derecha (plantilla y carga masiva) -->
    <template #actions-right>
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

      <GoogleButton
        type="submit"
        :loading="loading"
        :disabled="loading"
      >
        <span v-if="isEditing">Actualizar alumno</span>
        <span v-else>Guardar alumno</span>
      </GoogleButton>
    </template>
  </GenericForm>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AlumnoCreate } from '../../services/alumnos';
import type { Carrera } from '../../services/carreras';

// Shell de formulario genérico
import GenericForm from '../formulario/formulario.vue';

// Inputs/UI
import GoogleInput from '../ui/input.vue';
import GoogleSelect from '../ui/select.vue';
import GoogleButton from '../ui/button.vue';

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

// Texto del subtítulo
const formSubtitle = computed(() =>
  props.isEditing
    ? 'Completa los campos obligatorios para actualizar el registro seleccionado.'
    : 'Completa los campos obligatorios para registrar un nuevo alumno.',
);

// Options para el GoogleSelect
const carreraOptions = computed(() =>
  props.carreras.map((c) => ({
    value: c.id_carrera,
    label: `${c.nombre} (${c.duracion_semestres} semestres)`,
  })),
);

// Wrappers para conectar GenericForm con el padre (vista)
function onSubmitWrapper() {
  emit('submit');
}

function onCancelWrapper() {
  emit('cancel-edit');
}
</script>

<style scoped>
/* Solo estilos específicos de este form, el card y layout los pone GenericForm+SectionCard */

.field-checkbox {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1.4rem;
  font-size: 0.85rem;
}

.hint {
  font-size: 0.75rem;
  color: #a0a4a8;
  margin-top: 0.15rem;
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
