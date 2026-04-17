<!-- src/components/ui/chip.vue -->
<template>
  <span class="g-chip" :class="[`variant-${variant}`]">
    <slot></slot>
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'soft' | 'success' | 'warning' | 'error' | 'primary';
}

withDefaults(defineProps<Props>(), {
  variant: 'soft'
});
</script>

<style scoped>
.g-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  padding: 0.25rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.variant-soft {
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface-variant);
}

.variant-success {
  background: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
}

.variant-warning {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  opacity: 0.9;
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
