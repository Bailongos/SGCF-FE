<template>
  <div class="g-toast-container">
    <transition-group name="g-toast-stack">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="g-toast"
        :class="`g-toast--${t.type}`"
      >
        <span class="material-symbols-outlined g-toast-icon">{{ iconMap[t.type] }}</span>
        <div class="g-toast-content">
          <p class="g-toast-title">{{ t.title ?? defaultTitle(t.type) }}</p>
          <p class="g-toast-message">{{ t.message }}</p>
        </div>
        <button class="g-toast-close" @click="remove(t.id)" aria-label="Cerrar">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '../../composables/useToast';

const { toasts, remove } = useToast();

const iconMap: Record<string, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
};

function defaultTitle(type: string): string {
  if (type === 'success') return 'Listo';
  if (type === 'error') return 'Error';
  return 'Información';
}
</script>

<style scoped>
.g-toast-container {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.g-toast {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  max-width: 360px;
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

.g-toast-stack-enter-active,
.g-toast-stack-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.g-toast-stack-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.g-toast-stack-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.g-toast-stack-move {
  transition: transform 0.2s ease;
}
</style>
