<template>
  <transition name="g-toast-slide">
    <div
      v-if="visible"
      class="g-toast"
      :class="`g-toast--${type}`"
    >
      <span class="material-symbols-outlined g-toast-icon">
        {{ iconName }}
      </span>

      <div class="g-toast-content">
        <p class="g-toast-title">{{ titleToShow }}</p>
        <p class="g-toast-message">{{ messageToShow }}</p>
      </div>

      <button class="g-toast-close" @click="close" aria-label="Cerrar">
        ✕
      </button>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, watch, ref, onBeforeUnmount } from 'vue';

type ToastType = 'success' | 'error' | 'info';

const props = defineProps<{
  modelValue?: boolean;
  message?: string;
  title?: string;
  type?: ToastType;
  duration?: number; // ms, ej. 3000 = 3s
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'closed'): void;
}>();

const type = computed<ToastType>(() => props.type ?? 'success');
const visible = computed(() => props.modelValue ?? false);

const messageToShow = computed(
  () => props.message ?? 'Toast activado con éxito',
);

const titleToShow = computed(() => {
  if (props.title) return props.title;
  if (type.value === 'success') return 'Listo';
  if (type.value === 'error') return 'Error';
  return 'Información';
});

const iconName = computed(() => {
  if (type.value === 'success') return 'check_circle';
  if (type.value === 'error') return 'error';
  return 'info';
});

const timeoutId = ref<number | null>(null);

function clearTimer() {
  if (timeoutId.value != null) {
    window.clearTimeout(timeoutId.value);
    timeoutId.value = null;
  }
}

function startAutoHide() {
  clearTimer();
  const dur = props.duration ?? 3000; // default 3s
  if (dur <= 0) return;

  timeoutId.value = window.setTimeout(() => {
    close();
  }, dur);
}

function close() {
  clearTimer();
  emit('update:modelValue', false);
  emit('closed');
}

watch(
  () => visible.value,
  (newVal) => {
    if (newVal) {
      startAutoHide();
    } else {
      clearTimer();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearTimer();
});
</script>

<style scoped>
.g-toast {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 9999;

  display: flex;
  align-items: flex-start;
  gap: 0.6rem;

  max-width: 320px;
  padding: 0.75rem 0.9rem 0.75rem 0.8rem;
  border-radius: 12px;

  background: #ffffff;
  box-shadow:
    0 2px 4px rgba(60, 64, 67, 0.3),
    0 8px 16px rgba(60, 64, 67, 0.15);

  font-family: 'Roboto', system-ui, -apple-system, BlinkMacSystemFont,
    'Segoe UI', sans-serif;
}

/* Colores por tipo */
.g-toast--success {
  border-left: 4px solid #34a853;
}

.g-toast--error {
  border-left: 4px solid #d93025;
}

.g-toast--info {
  border-left: 4px solid #1a73e8;
}

/* Icono */
.g-toast-icon {
  margin-top: 0.05rem;
  font-size: 22px;
  color: #1a73e8;

  font-variation-settings:
    'FILL' 1,
    'wght' 500,
    'GRAD' 0,
    'opsz' 24;
}

.g-toast--success .g-toast-icon {
  color: #34a853;
}

.g-toast--error .g-toast-icon {
  color: #d93025;
}

.g-toast-content {
  flex: 1;
}

.g-toast-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #202124;
  margin-bottom: 0.1rem;
}

.g-toast-message {
  font-size: 0.8rem;
  color: #5f6368;
}

/* Botón cerrar */
.g-toast-close {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #5f6368;
  font-size: 0.9rem;
  padding: 0.1rem 0.2rem;
  border-radius: 999px;
  line-height: 1;
}

.g-toast-close:hover {
  background-color: rgba(95, 99, 104, 0.08);
}

/* Animación */
.g-toast-slide-enter-active,
.g-toast-slide-leave-active {
  transition:
    opacity 0.18s ease-out,
    transform 0.18s ease-out;
}

.g-toast-slide-enter-from,
.g-toast-slide-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>
