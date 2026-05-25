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
const color = computed(() => props.color ?? 'var(--md-sys-color-primary)');
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
  --g-btn-bg: var(--md-sys-color-primary);
  --g-btn-color: var(--md-sys-color-primary);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;

  border: 1px solid transparent;
  border-radius: 4px;
  padding: 0.4rem 1rem;
  min-width: 64px;

  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);

  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-weight: 600;
  font-size: 0.875rem;

  cursor: pointer;
  outline: none;
  position: relative;

  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.g-btn:hover:not(.g-btn--disabled) {
  filter: brightness(1.08);
}

.g-btn:active:not(.g-btn--disabled) {
  filter: brightness(0.95);
  transform: scale(0.98);
}

/* Variants */
.g-btn--filled {
  background: var(--g-btn-bg);
  color: var(--md-sys-color-on-primary);
  border-color: transparent;
}

.g-btn--filled:hover:not(.g-btn--disabled) {
  filter: brightness(1.08);
}

.g-btn--text {
  background: transparent;
  color: var(--g-btn-color);
  border-color: transparent;
}

.g-btn--text:hover:not(.g-btn--disabled) {
  background: color-mix(in srgb, var(--g-btn-color), transparent 92%);
  filter: none;
}

.g-btn--outlined {
  background: transparent;
  color: var(--g-btn-color);
  border-color: var(--md-sys-color-outline);
}

.g-btn--outlined:hover:not(.g-btn--disabled) {
  background: color-mix(in srgb, var(--g-btn-color), transparent 95%);
  border-color: var(--g-btn-color);
  filter: none;
}

.g-btn--sm { padding: 0.25rem 0.75rem; font-size: 0.8rem; }
.g-btn--md { padding: 0.4rem 1rem; font-size: 0.875rem; }
.g-btn--lg { padding: 0.55rem 1.35rem; font-size: 1rem; }

@media (max-width: 600px) {
  .g-btn--sm { padding: 0.3rem 0.85rem; font-size: 0.85rem; min-height: 36px; }
  .g-btn--md { padding: 0.45rem 1.1rem; font-size: 0.9rem; min-height: 40px; }
  .g-btn--lg { padding: 0.6rem 1.4rem; font-size: 1rem; min-height: 44px; }
}

.g-btn--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: none !important;
  transform: none !important;
}

.g-btn-spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: g-btn-spin 0.6s linear infinite;
}

@keyframes g-btn-spin {
  to { transform: rotate(360deg); }
}
</style>
