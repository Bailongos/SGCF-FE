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
      ✕
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type TagSize = 'sm' | 'md' | 'lg';
type TagVariant = 'soft' | 'solid' | 'outline';

const props = defineProps<{
  label?: string;
  color?: string;          // color principal (borde / fondo)
  size?: TagSize;
  variant?: TagVariant;
  icon?: string;           // nombre de material symbol, ej: "label", "sell"
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

// Color base (Google blue por defecto)
const baseColor = computed(
  () => props.color ?? '#1a73e8',
);

const tagStyle = computed(() => {
  // Usamos CSS vars para que el mismo estilo sirva para todas las variantes
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
  --g-tag-color: #1a73e8;

  display: inline-flex;
  align-items: center;
  gap: 0.25rem;

  border-radius: 999px;
  font-family: 'Roboto', system-ui, -apple-system, BlinkMacSystemFont,
    'Segoe UI', sans-serif;

  border: 1px solid transparent;
  padding: 0.15rem 0.6rem;
  font-size: 0.78rem;
  line-height: 1.2;

  color: #202124;
  background-color: #f1f3f4;

  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.08s ease;
}

/* Tamaños */
.g-tag--sm {
  padding: 0.1rem 0.5rem;
  font-size: 0.7rem;
}

.g-tag--md {
  padding: 0.15rem 0.6rem;
  font-size: 0.78rem;
}

.g-tag--lg {
  padding: 0.18rem 0.75rem;
  font-size: 0.82rem;
}

/* Variantes */
.g-tag--soft {
  background-color: rgba(26, 115, 232, 0.08);
  border-color: transparent;
  color: #1a73e8;
}

.g-tag--solid {
  background-color: var(--g-tag-color);
  border-color: var(--g-tag-color);
  color: #ffffff;
}

.g-tag--outline {
  background-color: transparent;
  border-color: var(--g-tag-color);
  color: var(--g-tag-color);
}

/* Icono */
.g-tag-icon {
  font-size: 1rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  font-variation-settings:
    'FILL' 1,
    'wght' 500,
    'GRAD' 0,
    'opsz' 20;
}

/* Label */
.g-tag-label {
  white-space: nowrap;
}

/* Cierre */
.g-tag-close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1;
  padding: 0;
  margin-left: 0.1rem;
  border-radius: 999px;
  color: inherit;
}

.g-tag--closable .g-tag-close:hover {
  background-color: rgba(60, 64, 67, 0.08);
}

/* Pequeña animación al hover */
.g-tag:hover {
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.2);
  transform: translateY(-0.5px);
}
</style>
