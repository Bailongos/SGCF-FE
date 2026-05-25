<template>
  <span
    class="g-tag"
    :class="[
      `g-tag--${variantResolved}`,
      `g-tag--${sizeResolved}`,
      { 'g-tag--closable': closable }
    ]"
    :style="tagStyle"
  >
    <span
      v-if="icon"
      class="material-symbols-outlined g-tag-icon"
    >
      {{ icon }}
    </span>

    <span class="g-tag-label">
      {{ labelToShow }}
    </span>

    <button
      v-if="closable"
      type="button"
      class="g-tag-close"
      @click.stop="handleClose"
      aria-label="Quitar etiqueta"
    >
      <span class="material-symbols-outlined">close</span>
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type TagSize = 'sm' | 'md' | 'lg';
type TagVariant = 'soft' | 'solid' | 'outline';

const props = defineProps<{
  label?: string;
  color?: string;
  size?: TagSize;
  variant?: TagVariant;
  icon?: string;
  closable?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const labelToShow = computed(
  () => props.label ?? 'Etiqueta',
);

const sizeResolved = computed<TagSize>(
  () => props.size ?? 'md',
);

const variantResolved = computed<TagVariant>(
  () => props.variant ?? 'soft',
);

const baseColor = computed(
  () => props.color ?? 'var(--md-sys-color-primary)',
);

const tagStyle = computed(() => {
  return {
    '--g-tag-color': baseColor.value,
  } as Record<string, string>;
});

function handleClose() {
  emit('close');
}
</script>

<style scoped>
.g-tag {
  --g-tag-color: var(--md-sys-color-primary);

  display: inline-flex;
  align-items: center;
  gap: 0.2rem;

  border-radius: 4px;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;

  border: 1px solid transparent;
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1.3;

  color: var(--md-sys-color-on-surface);
  background-color: var(--md-sys-color-surface-container);

  transition: background-color 0.12s ease;
}

.g-tag--sm {
  padding: 0.05rem 0.4rem;
  font-size: 0.68rem;
}

.g-tag--md {
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
}

.g-tag--lg {
  padding: 0.15rem 0.65rem;
  font-size: 0.8rem;
}

.g-tag--soft {
  background-color: color-mix(in srgb, var(--g-tag-color), transparent 90%);
  border-color: transparent;
  color: var(--g-tag-color);
}

.g-tag--solid {
  background-color: var(--g-tag-color);
  border-color: var(--g-tag-color);
  color: var(--md-sys-color-on-primary);
}

.g-tag--outline {
  background-color: transparent;
  border-color: var(--g-tag-color);
  color: var(--g-tag-color);
}

.g-tag-icon {
  font-size: 0.9rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.g-tag-label {
  white-space: nowrap;
}

.g-tag-close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.7rem;
  line-height: 1;
  padding: 0;
  margin-left: 0.05rem;
  border-radius: 4px;
  color: inherit;
  display: inline-flex;
  align-items: center;
}

.g-tag-close .material-symbols-outlined {
  font-size: 14px;
}

.g-tag--closable .g-tag-close:hover {
  background-color: color-mix(in srgb, var(--md-sys-color-on-surface), transparent 92%);
}
</style>
