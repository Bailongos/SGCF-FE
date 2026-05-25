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
        <span class="material-symbols-outlined">close</span>
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
  duration?: number;
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
  const dur = props.duration ?? 3000;
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
  right: 1rem;
  bottom: 1rem;
  z-index: 9999;

  display: flex;
  align-items: flex-start;
  gap: 0.5rem;

  max-width: 320px;
  padding: 0.65rem 0.8rem;
  border-radius: 8px;

  background: var(--md-sys-color-surface);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--md-sys-color-outline);
}

.g-toast-icon {
  margin-top: 0.05rem;
  font-size: 20px;
}

.g-toast--success .g-toast-icon {
  color: var(--md-sys-color-success);
}

.g-toast--error .g-toast-icon {
  color: var(--md-sys-color-error);
}

.g-toast--info .g-toast-icon {
  color: var(--md-sys-color-info);
}

.g-toast-content {
  flex: 1;
}

.g-toast-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
  margin-bottom: 0.05rem;
}

.g-toast-message {
  font-size: 0.78rem;
  color: var(--md-sys-color-on-surface-variant);
}

.g-toast-close {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.8rem;
  padding: 0.1rem;
  border-radius: 4px;
  line-height: 1;
  display: flex;
  align-items: center;
}

.g-toast-close .material-symbols-outlined {
  font-size: 16px;
}

.g-toast-close:hover {
  background-color: var(--md-sys-color-surface-container);
}

.g-toast-slide-enter-active,
.g-toast-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.g-toast-slide-enter-from,
.g-toast-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
