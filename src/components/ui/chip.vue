<template>
  <span class="g-chip" :class="[`variant-${variant}`, `g-chip--${size}`]">
    <slot></slot>
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'soft' | 'success' | 'warning' | 'error' | 'primary';
  size?: 'sm' | 'md';
}

withDefaults(defineProps<Props>(), {
  variant: 'soft',
  size: 'md',
});
</script>

<style scoped>
.g-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  font-weight: 500;
  transition: none;
}

.g-chip--md {
  padding: 0.2rem 0.65rem;
  font-size: 0.82rem;
}

.g-chip--sm {
  padding: 0.1rem 0.45rem;
  font-size: 0.72rem;
}

.variant-soft {
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface-variant);
}

.variant-success {
  background: var(--md-sys-color-success-container);
  color: var(--md-sys-color-on-success-container);
}

.variant-warning {
  background: var(--md-sys-color-warning-container);
  color: var(--md-sys-color-on-warning-container);
}

.variant-error {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

.variant-primary {
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}
</style>
