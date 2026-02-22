<template>
  <button
    class="g-btn"
    :class="[
      `g-btn--${size}`,
      `g-btn--${variant}`,
      {
        'g-btn--disabled': isDisabled,
        'g-btn--loading': loading,
      },
    ]"
    :style="{
      '--g-btn-bg': color,
      '--g-btn-color': color,
    }"
    :type="type"
    :disabled="isDisabled"
    :aria-busy="loading"
    @click="handleClick"
  >
    <span v-if="loading" class="g-btn-spinner" aria-hidden="true"></span>
    <slot>{{ label }}</slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'filled' | 'text' | 'outlined';
type NativeButtonType = 'button' | 'submit' | 'reset';

const props = defineProps<{
  label?: string;
  size?: Size;
  variant?: Variant;
  color?: string;
  loading?: boolean;
  type?: NativeButtonType;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const size = computed<Size>(() => props.size ?? 'md');
const variant = computed<Variant>(() => props.variant ?? 'filled');
const color = computed(() => props.color ?? '#1a73e8');
const type = computed<NativeButtonType>(() => props.type ?? 'button');
const loading = computed(() => props.loading ?? false);
const isDisabled = computed(() => (props.disabled ?? false) || loading.value);

function handleClick(event: MouseEvent) {
  if (isDisabled.value) return;
  emit('click', event);
}
</script>

<style scoped>
.g-btn {
  --g-btn-bg: #1a73e8;
  --g-btn-color: #1a73e8;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;

  border: 1px solid transparent;
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

.g-btn--filled {
  background-color: var(--g-btn-bg);
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3);
}

.g-btn--text {
  background-color: transparent;
  color: var(--g-btn-color);
  box-shadow: none;
}

.g-btn--outlined {
  background-color: #ffffff;
  color: var(--g-btn-color);
  border-color: rgba(95, 99, 104, 0.35);
  box-shadow: none;
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

.g-btn--text:hover:not(.g-btn--disabled) {
  filter: none;
  background-color: rgba(26, 115, 232, 0.08);
  box-shadow: none;
}

.g-btn--outlined:hover:not(.g-btn--disabled) {
  filter: none;
  background-color: rgba(26, 115, 232, 0.08);
  border-color: rgba(26, 115, 232, 0.45);
  box-shadow: none;
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

.g-btn-spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: g-btn-spin 0.75s linear infinite;
}

@keyframes g-btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
