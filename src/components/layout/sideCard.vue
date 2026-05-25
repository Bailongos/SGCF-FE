<template>
  <section class="g-section-card" :class="[
    `g-section-card--${densityClass}`,
    { 'g-section-card--clickable': clickable }
  ]" @click="handleClick">
    <header v-if="hasHeader" class="g-section-card__header">
      <div class="g-section-card__title-wrap">
        <span v-if="icon" class="material-symbols-outlined g-section-card__icon">
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

      <div v-if="slots['header-extra']" class="g-section-card__header-extra">
        <slot name="header-extra" />
      </div>
    </header>

    <div class="g-section-card__body">
      <slot />
    </div>

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
  icon?: string;
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
  border-radius: 8px;
  background: var(--md-sys-color-surface);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--md-sys-color-outline);
  transition: box-shadow 0.15s ease;
}

.g-section-card:hover {
  box-shadow: var(--shadow-lg);
}

.g-section-card--comfortable {
  padding: 1.25rem 1.5rem;
}

.g-section-card--cozy {
  padding: 1rem 1.25rem;
}

.g-section-card--compact {
  padding: 0.75rem 0.9rem;
}

.g-section-card--clickable {
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.g-section-card--clickable:hover {
  box-shadow: var(--shadow-lg);
}

.g-section-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
}

.g-section-card__title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.g-section-card__icon {
  font-size: 20px;
  color: var(--md-sys-color-primary);
  padding: 0.3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.g-section-card__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.g-section-card__subtitle {
  margin: 0.1rem 0 0;
  font-size: 0.8rem;
  color: var(--md-sys-color-on-surface-variant);
}

.g-section-card__header-extra {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.g-section-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.g-section-card__footer {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--md-sys-color-outline);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .g-section-card--comfortable,
  .g-section-card--cozy,
  .g-section-card--compact {
    padding: 1rem 1.1rem;
  }

  .g-section-card__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .g-section-card__header-extra {
    align-self: stretch;
    justify-content: flex-start;
    margin-top: 0.25rem;
  }
}
</style>
