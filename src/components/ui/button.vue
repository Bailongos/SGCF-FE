<template>
  <button
    class="g-btn"
    :class="[`g-btn--${size}`, { 'g-btn--disabled': disabled }]"
    :style="{
      '--g-btn-bg': color,
    }"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot>{{ label }}</slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type Size = 'sm' | 'md' | 'lg';

const props = defineProps<{
  label?: string;
  size?: Size;
  color?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const size = computed<Size>(() => props.size ?? 'md');
const color = computed(() => props.color ?? '#1a73e8'); // azul Google
const disabled = computed(() => props.disabled ?? false);

function handleClick(event: MouseEvent) {
  if (disabled.value) return;
  emit('click', event);
}
</script>

<style scoped>
.g-btn {
  --g-btn-bg: #1a73e8;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;

  border: none;
  border-radius: 999px;
  padding: 0.45rem 1.2rem;
  min-width: 72px;

  background-color: var(--g-btn-bg);
  color: #ffffff;

  font-family: 'Roboto', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  font-weight: 500;
  font-size: 0.9rem;
  letter-spacing: 0.02em;

  cursor: pointer;
  outline: none;

  /* Animaciones googlescas */
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3);
  transition:
    transform 0.08s ease-out,
    box-shadow 0.12s ease-out,
    background-color 0.15s ease-out,
    filter 0.15s ease-out,
    opacity 0.15s ease-out;
}

/* Tamaños */
.g-btn--sm {
  padding: 0.3rem 0.9rem;
  font-size: 0.8rem;
}

.g-btn--md {
  padding: 0.45rem 1.2rem;
  font-size: 0.9rem;
}

.g-btn--lg {
  padding: 0.6rem 1.5rem;
  font-size: 1rem;
}

/* Hover: un poquito más oscuro */
.g-btn:hover:not(.g-btn--disabled) {
  filter: brightness(0.95);
  box-shadow: 0 2px 6px rgba(60, 64, 67, 0.35);
}

/* Animación de click */
.g-btn:active:not(.g-btn--disabled) {
  transform: translateY(1px) scale(0.98);
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3);
}

/* Disabled */
.g-btn--disabled {
  opacity: 0.6;
  cursor: default;
  box-shadow: none;
}
</style>
