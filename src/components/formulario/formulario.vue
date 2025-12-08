<!-- src/components/formulario/GenericForm.vue -->
<template>
  <SectionCard
    class="g-form"
    icon="assignment"
    :title="titleToShow"
    :subtitle="subtitleToShow"
    density="comfortable"
  >
    <!-- Slot para meter algo en el header derecho (ej. chip "Editando: X") -->
    <template #header-right>
      <slot name="header-right" />
    </template>

    <!-- Mensaje de error simple (viene por prop) -->
    <p v-if="errorToShow" class="g-form-error">
      {{ errorToShow }}
    </p>

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
            <GoogleButton
              v-if="showCancel"
              type="button"
              variant="text"
              color="#5f6368"
              @click="onCancelClick"
            >
              {{ cancelLabelToShow }}
            </GoogleButton>
          </slot>
        </div>

        <div class="g-form-actions-right">
          <!-- Slot opcional para acciones derechas extra -->
          <slot name="actions-right">
            <GoogleButton
              type="submit"
              :loading="submitting"
              :disabled="submitting"
            >
              {{ submitLabelToShow }}
            </GoogleButton>
          </slot>
        </div>
      </div>
    </form>

    <!-- Confirm para cancelar -->
    <GoogleConfirmDialog
      v-model="confirmVisible"
      type="danger"
      title="¿Descartar cambios?"
      message="Perderás la información capturada en el formulario."
      confirmText="Sí, descartar"
      cancelText="Seguir editando"
      @confirm="doCancel"
    />
  </SectionCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// UI googlesca
import SectionCard from '../layout/sideCard.vue'; // ajusta la ruta si tu SectionCard está en otro lado
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

  // mensaje de error externo (validaciones del padre)
  errorMessage?: string;
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

const errorToShow = computed(
  () => props.errorMessage ?? '',
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

.g-form-error {
  font-size: 0.85rem;
  color: #d93025;
  margin-bottom: 0.25rem;
}

.g-form-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.g-form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem 1rem;
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
