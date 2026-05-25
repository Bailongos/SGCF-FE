<!-- src/components/dashboard/ObservacionForm.vue -->
<template>
  <form @submit.prevent="$emit('submit')" class="obs-form">
    <div class="obs-form-grid">
      <!-- Matrícula / alumno (solo si se permite elegir) -->
      <div class="field" v-if="allowSelectAlumno">
        <label class="g-input-label">Matrícula *</label>
        <input v-model="form.matricula" list="alumnos-list-form" required class="native-input" placeholder="Ej. 180054" />
        <datalist id="alumnos-list-form">
          <option v-for="al in alumnos" :key="al.matricula" :value="al.matricula">
            {{ al.matricula }} · {{ al.nombre_completo }}
          </option>
        </datalist>
      </div>
      <GoogleInput v-else v-model="form.matricula" label="Matrícula" disabled />

      <!-- Autor -->
      <div class="field">
        <label class="g-input-label">Autor (opcional)</label>
        <input v-model="form.autorTexto" list="usuarios-list-form" class="native-input"
          :placeholder="`Sugerencia: ${currentUsername}`" />
        <datalist id="usuarios-list-form">
          <option v-for="u in usuarios" :key="u.id_usuario" :value="u.username">
            {{ u.username }}
          </option>
        </datalist>
      </div>

      <GoogleSelect 
        v-model="form.tipo_clave" 
        :options="tipoOptions"
        label="Tipo de observación *" 
        required 
      />

      <!-- Detalle -->
      <div class="field span-2">
        <label class="g-input-label">Detalle *</label>
        <textarea v-model="form.detalle" required class="native-textarea" rows="4"
          placeholder="Escribe aquí la observación..."></textarea>
      </div>
    </div>

    <div v-if="error" class="form-error-box">
      <span class="material-symbols-outlined">error</span>
      {{ error }}
    </div>

    <div class="form-actions">
      <GoogleButton type="button" variant="text" :disabled="loading" @click="$emit('cancel')">
        Cancelar
      </GoogleButton>
      <GoogleButton type="submit" :loading="loading" :disabled="loading">
        {{ isEditing ? 'Actualizar' : 'Guardar' }}
      </GoogleButton>
      <label v-if="!isEditing" class="add-another-label">
        <input type="checkbox" :checked="addAnother" @change="emit('update:addAnother', ($event.target as HTMLInputElement).checked)" />
        <span>Agregar otro</span>
      </label>
    </div>
  </form>
</template>

<script setup lang="ts">
import GoogleInput from '../ui/input.vue';
import GoogleSelect from '../ui/select.vue';
import GoogleButton from '../ui/button.vue';

interface Props {
  form: any;
  tipoOptions: any[];
  alumnos?: any[];
  usuarios?: any[];
  currentUsername?: string;
  allowSelectAlumno?: boolean;
  error?: string | null;
  loading?: boolean;
  isEditing?: boolean;
  addAnother?: boolean;
}

withDefaults(defineProps<Props>(), {
  allowSelectAlumno: false,
  alumnos: () => [],
  usuarios: () => [],
  currentUsername: '',
  loading: false,
  isEditing: false,
  addAnother: false
});
const emit = defineEmits<{
  (e: 'submit'): void;
  (e: 'cancel'): void;
  (e: 'update:addAnother', v: boolean): void;
}>();
</script>

<style scoped>
.obs-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.span-2 { grid-column: span 2; }

.native-input, .native-textarea {
  width: 100%;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
  padding: 0.65rem 0.75rem;
  font-family: inherit;
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  transition: border-color 0.2s;
}

.native-input:focus, .native-textarea:focus {
  outline: none;
  border-color: var(--md-sys-color-primary);
}

.native-textarea { resize: vertical; }

.form-error-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  border-radius: 8px;
  margin-top: 1rem;
}

@media (max-width: 600px) {
  .obs-form-grid { grid-template-columns: 1fr; }
  .span-2 { grid-column: span 1; }
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--md-sys-color-outline-variant);
}

.add-another-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: auto;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--md-sys-color-on-surface-variant);
}</style>
