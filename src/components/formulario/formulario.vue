<!-- src/components/formulario/GenericForm.vue -->
<template>
  <div class="g-form">
    <!-- Header Opcional si se quiere mostrar el título independientemente del modal -->
    <header class="g-form-header" v-if="titleToShow || subtitleToShow">
      <div>
        <h2 v-if="titleToShow" class="g-form-title">{{ titleToShow }}</h2>
        <p v-if="subtitleToShow" class="g-form-subtitle">{{ subtitleToShow }}</p>
      </div>
      <div class="g-form-header-right">
        <slot name="header-right" />
      </div>
    </header>

    <!-- Formulario -->
    <form @submit.prevent="handleSubmit" class="g-form-body">
      <div class="g-form-grid">
        <!-- Aquí van los campos concretos (alumnos, pagos, etc.) -->
        <slot />
      </div>

      <!-- Acciones -->
      <div class="g-form-actions">
        <div class="g-form-actions-left">
          <!-- Slot opcional para personalizar acciones izquierdas -->
          <slot name="actions-left">
            <GoogleButton v-if="showCancel" type="button" variant="text" @click="onCancelClick">
              {{ cancelLabelToShow }}
            </GoogleButton>
          </slot>
        </div>

        <div class="g-form-actions-right">
          <!-- Slot opcional para acciones derechas extra -->
          <slot name="actions-right">
            <GoogleButton type="submit" :loading="submitting" :disabled="submitting">
              {{ submitLabelToShow }}
            </GoogleButton>
          </slot>
        </div>
      </div>
    </form>

    <!-- Confirm para cancelar -->
    <GoogleConfirmDialog v-model="confirmVisible" type="danger" title="¿Descartar cambios?"
      message="Perderás la información capturada en el formulario." confirmText="Sí, descartar"
      cancelText="Seguir editando" @confirm="doCancel" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// UI googlesca
import GoogleButton from '../ui/button.vue';
import GoogleConfirmDialog from '../modal/alert.vue';

const props = defineProps<{
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;

  // estado externo de "guardando"
  submitting?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit'): void;
  (e: 'cancel'): void;
}>();

const confirmVisible = ref(false);

// Textos con default
const titleToShow = computed(
  () => props.title ?? 'Formulario',
);

const subtitleToShow = computed(
  () =>
    props.subtitle ??
    'Captura la información requerida y guarda los cambios.',
);

const submitLabelToShow = computed(
  () => props.submitLabel ?? 'Guardar',
);

const cancelLabelToShow = computed(
  () => props.cancelLabel ?? 'Cancelar',
);

const showCancel = computed(
  () => props.showCancel ?? true,
);

const submitting = computed(
  () => props.submitting ?? false,
);

// Enviar
function handleSubmit() {
  emit('submit');
}

// Cancelar
function onCancelClick() {
  if (!showCancel.value) return;
  confirmVisible.value = true;
}

function doCancel() {
  emit('cancel');
}
</script>

<style scoped>
.g-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.g-form-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.g-form-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
}

.g-form-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: var(--md-sys-color-on-surface-variant);
}

.g-form-header-right {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.g-form-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.g-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  /* 2 columns is better than 3 for most screens */
  gap: 1.25rem 1.5rem;
  padding: 0 0.25rem;
}

@media (max-width: 768px) {
  .g-form-grid {
    grid-template-columns: 1fr;
  }
}

.g-form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.g-form-actions-left,
.g-form-actions-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
