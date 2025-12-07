<template>
  <transition name="g-dialog-fade">
    <div
      v-if="modelValue"
      class="g-dialog-backdrop"
      @click="onBackdropClick"
    >
      <div
        class="g-dialog"
        :class="`g-dialog--${dialogType}`"
        @click.stop
      >
        <div class="g-dialog-header">
          <span class="material-symbols-outlined g-dialog-icon">
            {{ iconName }}
          </span>
          <div class="g-dialog-titles">
            <h2 class="g-dialog-title">
              {{ titleToShow }}
            </h2>
            <p class="g-dialog-subtitle">
              {{ messageToShow }}
            </p>
          </div>
        </div>

        <div class="g-dialog-actions">
          <button
            type="button"
            class="g-btn g-btn-text"
            @click="handleCancel"
          >
            {{ cancelTextToShow }}
          </button>

          <button
            type="button"
            class="g-btn g-btn-primary"
            @click="handleConfirm"
          >
            {{ confirmTextToShow }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue';

// 👇 ahora acepta 'error' además de 'default' y 'danger'
type DialogType = 'default' | 'danger' | 'error';

const props = defineProps<{
  modelValue: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
  closeOnBackdrop?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const dialogType = computed<DialogType>(() => props.type ?? 'default');

const titleToShow = computed(
  () => props.title ?? '¿Confirmar acción?',
);

const messageToShow = computed(
  () =>
    props.message ??
    'Esta acción no se puede deshacer. ¿Deseas continuar?',
);

const confirmTextToShow = computed(
  () => props.confirmText ?? 'Aceptar',
);

const cancelTextToShow = computed(
  () => props.cancelText ?? 'Cancelar',
);

const iconName = computed(() => {
  // tratamos 'error' igual que 'danger'
  if (dialogType.value === 'danger' || dialogType.value === 'error') {
    return 'warning';
  }
  return 'help';
});

function close() {
  emit('update:modelValue', false);
}

function handleConfirm() {
  emit('confirm');
  close();
}

function handleCancel() {
  emit('cancel');
  close();
}

function onBackdropClick() {
  if (props.closeOnBackdrop ?? true) {
    handleCancel();
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (!props.modelValue) return;

  if (e.key === 'Escape') {
    handleCancel();
  }

  if (e.key === 'Enter') {
    handleConfirm();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.g-dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(32, 33, 36, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
}

.g-dialog {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 16px;
  padding: 1rem 1.15rem 0.85rem;
  box-shadow:
    0 2px 4px rgba(60, 64, 67, 0.3),
    0 8px 16px rgba(60, 64, 67, 0.15);
  font-family: 'Roboto', system-ui, -apple-system, BlinkMacSystemFont,
    'Segoe UI', sans-serif;
}

/* variantes */
.g-dialog--default .g-dialog-icon {
  color: #1a73e8;
}

.g-dialog--danger .g-dialog-icon,
.g-dialog--error .g-dialog-icon {
  color: #d93025;
}

.g-dialog-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.g-dialog-icon {
  font-variation-settings:
    'FILL' 1,
    'wght' 500,
    'GRAD' 0,
    'opsz' 24;
  font-size: 24px;
  margin-top: 0.1rem;
}

.g-dialog-title {
  font-size: 1rem;
  font-weight: 500;
  color: #202124;
  margin-bottom: 0.1rem;
}

.g-dialog-subtitle {
  font-size: 0.85rem;
  color: #5f6368;
}

.g-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
  margin-top: 1rem;
}

/* Botones */
.g-btn {
  border-radius: 999px;
  border: none;
  font-size: 0.85rem;
  padding: 0.4rem 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.08s ease;
}

.g-btn-primary {
  background-color: #1a73e8;
  color: #ffffff;
}

.g-btn-primary:hover {
  background-color: #185abc;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3);
}

.g-btn-primary:active {
  transform: scale(0.97);
}

.g-btn-text {
  background: transparent;
  color: #1a73e8;
}

.g-btn-text:hover {
  background-color: rgba(26, 115, 232, 0.08);
}

.g-btn-text:active {
  transform: scale(0.97);
}

/* Animación */
.g-dialog-fade-enter-active,
.g-dialog-fade-leave-active {
  transition:
    opacity 0.18s ease-out,
    transform 0.18s ease-out;
}

.g-dialog-fade-enter-from,
.g-dialog-fade-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.97);
}
</style>
