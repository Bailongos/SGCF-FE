<!-- src/components/modal/GoogleModal.vue -->
<template>
  <Teleport to="body">
    <transition :css="false" @before-enter="onBeforeEnter" @enter="onEnter" @leave="onLeave">
      <div v-if="visible" class="g-modal-overlay" @click="onOverlayClick">
        <div class="g-modal-dialog" :style="{ maxWidth }" @click.stop>
          <div class="g-modal-card-wrapper">
            <button type="button" class="g-modal-close-btn" @click="close" aria-label="Cerrar">
              <span class="material-symbols-outlined">close</span>
            </button>
            <SectionCard class="g-modal-card" :icon="icon" :title="title" :subtitle="subtitle" :density="density">
              <!-- Contenido que meta el padre -->
              <slot />

              <!-- Footer por defecto con botones -->
              <div v-if="showFooter" class="g-modal-footer">
                <!-- Checkbox "Agregar otro" -->
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

              <!-- Slot para footer personalizado completamente -->
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

// UI que ya tienes
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

  // Para bloquear cierre por overlay / ESC
  persistent?: boolean;
  // Para deshabilitar cierre por overlay pero sí por ESC
  closeOnOverlay?: boolean;

  // Para mostrar loading en el botón de confirmar
  confirmLoading?: boolean;

  // Para permitir agregar múltiples (quedarse abierto)
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

// Cerrar modal
function close() {
  if (props.persistent) return;
  visible.value = false;
  emit('close');
}

// Overlay
function onOverlayClick() {
  if (!props.closeOnOverlay || props.persistent) return;
  close();
}

// ESC para cerrar
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

// Botones
function onConfirm() {
  emit('confirm');
}

function onCancel() {
  emit('cancel');
  if (!props.persistent) {
    close();
  }
}

const onBeforeEnter = (el: any) => {
  el.style.opacity = 0;
  const dialog = el.querySelector('.g-modal-dialog');
  if (dialog) {
    dialog.style.transform = 'translateY(20px) scale(0.95)';
  }
};

const onEnter = (el: any, done: () => void) => {
  const dialog = el.querySelector('.g-modal-dialog');

  import('animejs').then(({ animate }) => {
    // Overlay fade
    animate(el, {
      opacity: [0, 1],
      duration: 300,
      easing: 'easeOutQuad'
    });

    if (dialog) {
      animate(dialog, {
        translateY: [20, 0],
        scale: [0.95, 1],
        opacity: [0, 1],
        duration: 450,
        easing: 'easeOutElastic(1, .8)'
      }).then(done);
    } else {
      done();
    }
  });
};

const onLeave = (el: any, done: () => void) => {
  const dialog = el.querySelector('.g-modal-dialog');

  import('animejs').then(({ animate }) => {
    // Fade out overlay
    animate(el, {
      opacity: 0,
      duration: 250,
      easing: 'easeInQuad'
    });

    if (dialog) {
      animate(dialog, {
        translateY: 15,
        scale: 0.97,
        opacity: 0,
        duration: 200,
        easing: 'easeInQuad'
      }).then(done);
    } else {
      done();
    }
  });
};
</script>

<style scoped>
/* Converted to var for theme support */
.g-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--md-sys-color-scrim);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  /* Increased to be above App.vue header which has z-index 1000 */
}

.g-modal-dialog {
  width: 100%;
  margin: 1rem;
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
  transform-origin: center;
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
  /* Add padding space for the absolute close button if density is compact, though comfortable is default */
}

/* Ensure the close button is visible and above other content */
.g-modal-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 1.2rem;
  color: var(--md-sys-color-on-surface-variant);
  transition: background-color 0.15s ease, color 0.15s ease;
  z-index: 10;
  box-shadow: none; /* Reset global button shadow */
  padding: 0;
}

.g-modal-close-btn:hover {
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
}


/* Animación */
.g-modal-fade-enter-active,
.g-modal-fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.g-modal-fade-enter-from,
.g-modal-fade-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.97);
}

/* Footer */
.g-modal-footer {
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--md-sys-color-outline-variant);
}

.g-modal-footer-actions {
  display: flex;
  gap: 0.5rem;
}

.g-modal-add-another {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
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
</style>
