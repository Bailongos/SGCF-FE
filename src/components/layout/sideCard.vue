<template>
  <section
    class="g-section-card"
    :class="[
      `g-section-card--${densityClass}`,
      { 'g-section-card--clickable': clickable }
    ]"
    @click="handleClick"
  >
    <!-- Header -->
    <header v-if="hasHeader" class="g-section-card__header">
      <div class="g-section-card__title-wrap">
        <span
          v-if="icon"
          class="material-symbols-outlined g-section-card__icon"
        >
          {{ icon }}
        </span>

        <div>
          <h2 v-if="title" class="g-section-card__title">
            {{ title }}
          </h2>
          <p v-if="subtitle" class="g-section-card__subtitle">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <!-- Acciones extra en header -->
      <div
        v-if="slots['header-extra']"
        class="g-section-card__header-extra"
      >
        <slot name="header-extra" />
      </div>
    </header>

    <!-- Body -->
    <div class="g-section-card__body">
      <slot />
    </div>

    <!-- Footer -->
    <footer v-if="slots.footer" class="g-section-card__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';

type Density = 'comfortable' | 'cozy' | 'compact';

const props = defineProps<{
  title?: string;
  subtitle?: string;
  icon?: string;        // material icon, ej: "school"
  clickable?: boolean;
  density?: Density;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const slots = useSlots();

const densityClass = computed<Density>(() => props.density ?? 'comfortable');

const hasHeader = computed(
  () =>
    !!props.title ||
    !!props.subtitle ||
    !!props.icon ||
    !!slots['header-extra'],
);

const clickable = computed(() => props.clickable ?? false);

function handleClick() {
  if (!clickable.value) return;
  emit('click');
}
</script>

<style scoped>
.g-section-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.15);
  border: 1px solid rgba(218, 220, 224, 0.6);
  font-family: 'Roboto', system-ui, -apple-system, BlinkMacSystemFont,
    'Segoe UI', sans-serif;
  animation: g-section-card-enter 0.24s ease-out;
  transform-origin: top center;
  overflow: hidden;
}

/* densidad */
.g-section-card--comfortable {
  padding: 1.25rem 1.4rem;
}

.g-section-card--cozy {
  padding: 1rem 1.2rem;
}

.g-section-card--compact {
  padding: 0.75rem 1rem;
}

/* clickable */
.g-section-card--clickable {
  cursor: pointer;
  transition:
    box-shadow 0.16s ease,
    transform 0.16s ease,
    background-color 0.16s ease,
    border-color 0.16s ease;
}

.g-section-card--clickable:hover {
  box-shadow: 0 3px 10px rgba(60, 64, 67, 0.28);
  transform: translateY(-1px);
  background-color: #f8f9fa;
  border-color: rgba(210, 227, 252, 0.9);
}

/* Header */
.g-section-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.g-section-card__title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
}

.g-section-card__icon {
  font-variation-settings:
    'FILL' 0,
    'wght' 500,
    'GRAD' 0,
    'opsz' 24;
  font-size: 24px;
  color: #1a73e8;
  background: #e8f0fe;
  border-radius: 12px;
  padding: 0.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.g-section-card__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 500;
  color: #202124;
}

.g-section-card__subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.86rem;
  color: #5f6368;
}

.g-section-card__header-extra {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

/* Body */
.g-section-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Footer */
.g-section-card__footer {
  margin-top: 0.9rem;
  padding-top: 0.6rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Animación entrada */
@keyframes g-section-card-enter {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .g-section-card--comfortable,
  .g-section-card--cozy,
  .g-section-card--compact {
    padding: 0.9rem 1rem;
  }

  .g-section-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .g-section-card__header-extra {
    align-self: stretch;
    justify-content: flex-start;
  }
}
</style>
