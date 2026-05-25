<!-- src/components/admin/AdminUserForm.vue -->
<template>
  <form class="user-form" @submit.prevent="$emit('submit')">
    <div class="user-form-grid">
      <GoogleSelect
        v-if="!isEditing"
        v-model="form.createMode"
        :options="createModeOptions"
        label="Modo de alta *"
        placeholder="Selecciona modo"
      />

      <GoogleInput
        v-model="form.username"
        label="Usuario *"
        placeholder="Ej. maria.lopez"
        required
      />

      <GoogleInput
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="usuario@dominio.com"
        :required="!isEditing && form.createMode === 'preregister'"
      />

      <GoogleInput
        v-model="form.password"
        label="Password"
        type="password"
        :required="!isEditing && form.createMode === 'local'"
        :hint="isEditing ? 'Opcional: escribe solo si deseas resetear password local.' : 'Temporal para primer acceso.'"
        placeholder="••••••••"
      />

      <GoogleSelect
        v-model="form.id_rol"
        :options="roleOptions"
        label="Rol *"
        placeholder="Selecciona rol"
        required
      />

      <GoogleSelect
        v-model="form.id_carrera"
        :options="careerOptions"
        label="Carrera / alcance"
        placeholder="Global"
        :disabled="isAdminRole"
        :required="isCoordinatorRole"
        :hint="careerHint"
      />

      <label class="checkbox-field">
        <input v-model="form.activo" type="checkbox" :disabled="isPendingFromCreateMode" />
        <span>Usuario activo</span>
      </label>
    </div>

  </form>
</template>

<script setup lang="ts">
import GoogleInput from '../ui/input.vue';
import GoogleSelect from '../ui/select.vue';

interface Props {
  form: any;
  isEditing: boolean;
  roleOptions: any[];
  careerOptions: any[];
  isAdminRole: boolean;
  isCoordinatorRole: boolean;
  isPendingFromCreateMode: boolean;
  careerHint: string;
}

defineProps<Props>();
defineEmits(['submit']);

const createModeOptions = [
  { value: 'local', label: 'Usuario local' },
  { value: 'preregister', label: 'Preregistro por email' },
];
</script>

<style scoped>
.user-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  color: var(--md-sys-color-on-surface);
  padding-top: 1rem;
}

@media (max-width: 900px) {
  .user-form-grid { grid-template-columns: 1fr; }
}
</style>
