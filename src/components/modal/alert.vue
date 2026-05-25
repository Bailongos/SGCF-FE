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
            class="g-dialog-btn g-dialog-btn--text"
            @click="handleCancel"
          >
            {{ cancelTextToShow }}
          </button>

          <button
            type="button"
            class="g-dialog-btn g-dialog-btn--primary"
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
  background: var(--md-sys-color-scrim);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
}

.g-dialog {
  width: 100%;
  max-width: 420px;
  background: var(--md-sys-color-surface);
  border-radius: 8px;
  padding: 1rem 1.15rem 0.85rem;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--md-sys-color-outline);
}

.g-dialog--default .g-dialog-icon {
  color: var(--md-sys-color-primary);
}

.g-dialog--danger .g-dialog-icon,
.g-dialog--error .g-dialog-icon {
  color: var(--md-sys-color-error);
}

.g-dialog-header {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}

.g-dialog-icon {
  font-size: 22px;
  margin-top: 0.1rem;
}

.g-dialog-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  margin-bottom: 0.1rem;
}

.g-dialog-subtitle {
  font-size: 0.82rem;
  color: var(--md-sys-color-on-surface-variant);
}

.g-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
  margin-top: 1rem;
}

.g-dialog-btn {
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.35rem 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.g-dialog-btn--primary {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border-color: var(--md-sys-color-primary);
}

.g-dialog-btn--primary:hover {
  filter: brightness(1.08);
}

.g-dialog-btn--text {
  background: transparent;
  color: var(--md-sys-color-primary);
}

.g-dialog-btn--text:hover {
  background: color-mix(in srgb, var(--md-sys-color-primary), transparent 92%);
}

.g-dialog-fade-enter-active,
.g-dialog-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.g-dialog-fade-enter-from,
.g-dialog-fade-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.97);
}
</style>
