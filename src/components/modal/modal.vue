<template>
  <Teleport to="body">
    <transition name="g-modal-fade">
      <div v-if="visible" class="g-modal-overlay" @click="onOverlayClick">
        <div class="g-modal-dialog" :style="{ maxWidth }" @click.stop>
          <div class="g-modal-card-wrapper">
            <button type="button" class="g-modal-close-btn" @click="close" aria-label="Cerrar">
              <span class="material-symbols-outlined">close</span>
            </button>
            <SectionCard class="g-modal-card" :icon="icon" :title="title" :subtitle="subtitle" :density="density">
              <slot />

              <div v-if="showFooter" class="g-modal-footer">
                <label v-if="showAddAnother" class="g-modal-add-another">
                  <input type="checkbox" v-model="addAnotherVal" />
                  <span>Agregar otro</span>
                </label>

                <div class="g-modal-footer-actions">
                  <slot name="footer-extra" />
                  <GoogleButton v-if="showCancel" type="button" variant="text" @click="onCancel">
                    {{ cancelTextToShow }}
                  </GoogleButton>

                  <GoogleButton type="button" :loading="confirmLoading" :disabled="confirmLoading" @click="onConfirm">
                    {{ confirmTextToShow }}
                  </GoogleButton>
                </div>
              </div>

              <div v-else-if="$slots.footer" class="g-modal-footer">
                <slot name="footer" />
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue';

import SectionCard from '../layout/sideCard.vue';
import GoogleButton from '../ui/button.vue';

type Density = 'comfortable' | 'compact';

const props = withDefaults(defineProps<{
  modelValue: boolean;

  title?: string;
  subtitle?: string;
  icon?: string;

  maxWidth?: string;
  density?: Density;

  showFooter?: boolean;
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;

  persistent?: boolean;
  closeOnOverlay?: boolean;

  confirmLoading?: boolean;

  showAddAnother?: boolean;
  addAnother?: boolean;
}>(), {
  maxWidth: '640px',
  density: 'comfortable',
  showFooter: true,
  showCancel: true,
  confirmText: 'Aceptar',
  cancelText: 'Cancelar',
  persistent: false,
  closeOnOverlay: true,
  confirmLoading: false,
  showAddAnother: false,
  addAnother: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update:addAnother', value: boolean): void;
  (e: 'close'): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

// const slots = useSlots();

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
});

const addAnotherVal = computed({
  get: () => props.addAnother,
  set: (val: boolean) => emit('update:addAnother', val),
});

const confirmTextToShow = computed(
  () => props.confirmText ?? 'Aceptar',
);

const cancelTextToShow = computed(
  () => props.cancelText ?? 'Cancelar',
);

function close() {
  if (props.persistent) return;
  visible.value = false;
  emit('close');
}

function onOverlayClick() {
  if (!props.closeOnOverlay || props.persistent) return;
  close();
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && visible.value && !props.persistent) {
    close();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});

function onConfirm() {
  emit('confirm');
}

function onCancel() {
  emit('cancel');
  if (!props.persistent) {
    close();
  }
}
</script>

<style scoped>
.g-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--md-sys-color-scrim);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.g-modal-dialog {
  width: 100%;
  max-width: var(--modal-max-width, 640px);
  margin: 1rem;
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
}

.g-modal-card-wrapper {
  position: relative;
  width: 100%;
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
}

.g-modal-card {
  position: relative;
  overflow-y: auto;
  max-height: 100%;
}

.g-modal-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 1.1rem;
  color: var(--md-sys-color-on-surface-variant);
  transition: all 0.12s ease;
  z-index: 10;
  padding: 0;
}

.g-modal-close-btn:hover {
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
}

.g-modal-footer {
  margin-top: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--md-sys-color-outline);
}

.g-modal-footer-actions {
  display: flex;
  gap: 0.5rem;
}

.g-modal-add-another {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  user-select: none;
}

.g-modal-add-another input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--md-sys-color-primary);
}

/* CSS transitions (no animejs) */
.g-modal-fade-enter-active,
.g-modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.g-modal-fade-enter-active .g-modal-dialog,
.g-modal-fade-leave-active .g-modal-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.g-modal-fade-enter-from,
.g-modal-fade-leave-to {
  opacity: 0;
}

.g-modal-fade-enter-from .g-modal-dialog {
  transform: translateY(20px) scale(0.96);
  opacity: 0;
}

.g-modal-fade-leave-to .g-modal-dialog {
  transform: translateY(12px) scale(0.98);
  opacity: 0;
}

@media (max-width: 600px) {
  .g-modal-dialog {
    margin: 0.5rem;
    max-height: calc(100vh - 1rem);
  }

  .g-modal-overlay {
    align-items: flex-end;
  }

  .g-modal-dialog {
    max-width: 100% !important;
  }

  .g-modal-card {
    border-radius: 8px 8px 0 0;
  }

  .g-modal-footer {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }

  .g-modal-footer-actions {
    width: 100%;
  }

  .g-modal-footer-actions .g-btn {
    flex: 1;
  }

  .g-modal-close-btn {
    width: 40px;
    height: 40px;
    top: 6px;
    right: 6px;
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .g-modal-dialog {
    margin: 0;
    max-height: 100vh;
  }

  .g-modal-card {
    border-radius: 0;
    max-height: 100vh;
    padding: 1rem;
  }
}
</style>
