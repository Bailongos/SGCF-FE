<!-- src/components/dashboard/CuentaForm.vue -->
<template>
  <form @submit.prevent="$emit('submit')" class="cuenta-form">
    <div class="form-grid">
      <GoogleInput v-model="form.matricula" label="Matrícula" disabled />
      
      <GoogleSelect 
        v-model="form.concepto" 
        :options="conceptoOptions" 
        label="Concepto *"
        placeholder="Selecciona concepto..." 
        required 
      />
      
      <GoogleSelect 
        v-model="form.id_ciclo" 
        :options="cicloOptions" 
        label="Ciclo Escolar *" 
        required 
      />
      
      <GoogleInput 
        v-model.number="form.monto" 
        label="Monto *" 
        type="number" 
        step="0.01" 
        min="0" 
        required 
      />
      
      <label class="field-checkbox span-2">
        <input v-model="form.pagado" type="checkbox" />
        <span>Marcar como pagado</span>
      </label>
      
      <div class="field" v-if="form.pagado">
        <label class="g-input-label">Fecha de pago</label>
        <input v-model="form.fecha_pago" type="date" class="date-input" />
      </div>
      
      <GoogleSelect 
        v-if="form.pagado" 
        v-model="form.id_metodo" 
        :options="metodoOptions"
        label="Método de pago" 
        placeholder="Método..." 
      />
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
  conceptoOptions: any[];
  cicloOptions: any[];
  metodoOptions: any[];
  error?: string | null;
  loading?: boolean;
  isEditing?: boolean;
  addAnother?: boolean;
}

withDefaults(defineProps<Props>(), {
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
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.span-2 { grid-column: span 2; }

.date-input {
  width: 100%;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  font-family: inherit;
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}

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
  .form-grid { grid-template-columns: 1fr; }
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
}
</style>
