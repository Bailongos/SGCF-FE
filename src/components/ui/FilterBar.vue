<template>
  <div v-if="compact" class="filterbar filterbar--compact">
    <div class="filterbar-grid">
      <slot />
      <div v-if="activeCount > 0" class="filterbar-clear-cell">
        <GoogleButton variant="text" size="sm" @click="$emit('clear')">
          <span class="material-symbols-outlined">filter_alt_off</span>
          <GoogleChip variant="soft" size="sm">{{ activeCount }}</GoogleChip>
        </GoogleButton>
      </div>
      <div v-if="$slots.actions" class="filterbar-actions-cell">
        <slot name="actions" />
      </div>
    </div>
  </div>

  <div v-else class="filterbar filterbar--normal">
    <div class="filterbar-grid">
      <slot />
    </div>

    <div v-if="activeCount > 0 || $slots.actions" class="filterbar-footer">
      <div class="filterbar-footer-left">
        <GoogleButton v-if="activeCount > 0" variant="text" size="sm" @click="$emit('clear')">
          <span class="material-symbols-outlined">filter_alt_off</span>
          Limpiar filtros
          <GoogleChip variant="soft" size="sm">{{ activeCount }}</GoogleChip>
        </GoogleButton>
      </div>

      <div class="filterbar-footer-right">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GoogleButton from './button.vue';
import GoogleChip from './chip.vue';

withDefaults(defineProps<{
  activeCount?: number;
  compact?: boolean;
}>(), {
  activeCount: 0,
  compact: false,
});

defineEmits<{
  (e: 'clear'): void;
}>();
</script>

<style scoped>
.filterbar {
  background: var(--md-sys-color-surface-container);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;
}

.filterbar--normal {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.filterbar--compact {
  padding: 0.65rem;
}

.filterbar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  align-items: end;
}

.filterbar--compact .filterbar-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.filterbar--compact .filterbar-grid > :not(.filterbar-clear-cell):not(.filterbar-actions-cell) {
  flex: 1;
  min-width: 140px;
}

.filterbar-clear-cell,
.filterbar-actions-cell {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.filterbar-actions-cell {
  justify-content: flex-end;
  gap: 0.5rem;
}

.filterbar-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  padding-top: 0.75rem;
  min-height: 2rem;
}

.filterbar-footer-left {
  display: flex;
  align-items: center;
}

.filterbar-footer-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .filterbar--compact .filterbar-grid > :not(.filterbar-clear-cell):not(.filterbar-actions-cell) {
    width: 100%;
    min-width: 100%;
  }

  .filterbar-footer {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }

  .filterbar-footer-left,
  .filterbar-footer-right {
    width: 100%;
  }

  .filterbar-footer-right {
    justify-content: flex-end;
  }

  .filterbar-clear-cell,
  .filterbar-actions-cell {
    width: 100%;
  }

  .filterbar-actions-cell {
    justify-content: flex-start;
  }
}
</style>
