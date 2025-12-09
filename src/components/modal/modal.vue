<!-- src/components/modal/GoogleModal.vue -->
<template>
  <Teleport to="body">
    <transition name="g-modal-fade">
      <div
        v-if="visible"
        class="g-modal-overlay"
        @click="onOverlayClick"
      >
        <div
          class="g-modal-dialog"
          :style="{ maxWidth }"
          @click.stop
        >
          <SectionCard
            class="g-modal-card"
            :icon="icon"
            :title="title"
            :subtitle="subtitle"
            :density="density"
          >
            <!-- Contenido que meta el padre -->
            <slot />

            <!-- Footer por defecto con botones -->
            <div
              v-if="showFooter"
              class="g-modal-footer"
            >
              <GoogleButton
                v-if="showCancel"
                type="button"
                variant="text"
                color="#5f6368"
                @click="onCancel"
              >
                {{ cancelTextToShow }}
              </GoogleButton>

              <GoogleButton
                type="button"
                :loading="confirmLoading"
                :disabled="confirmLoading"
                @click="onConfirm"
              >
                {{ confirmTextToShow }}
              </GoogleButton>
            </div>
          </SectionCard>
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
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
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
  // El padre decide si cierra o no,
  // para poder esperar a una llamada async
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
  background: rgba(32, 33, 36, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 60;
}

.g-modal-dialog {
  width: 100%;
  margin: 0 1rem;
  transform-origin: center;
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
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
