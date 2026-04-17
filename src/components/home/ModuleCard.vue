<!-- src/components/home/ModuleCard.vue -->
<template>
  <component
    :is="allowed ? 'RouterLink' : 'article'"
    :to="allowed ? to : undefined"
    class="module-card"
    :class="{ 
      'featured': featured, 
      'module-card--locked': !allowed 
    }"
    :style="{ '--card-color': themeColor }"
    :tabindex="!allowed ? 0 : undefined"
    :role="!allowed ? 'button' : undefined"
    :aria-disabled="!allowed"
  >
    <div class="card-glow"></div>
    
    <div class="module-icon-container">
      <span class="material-symbols-outlined">
        {{ icon }}
      </span>
    </div>

    <div class="card-content">
      <h2 class="module-title">{{ title }}</h2>
      <p class="module-desc">{{ desc }}</p>
    </div>

    <div v-if="!allowed" class="card-arrow">
      <span class="material-symbols-outlined">lock</span>
    </div>

    <div class="card-badges">
      <span v-if="featured" class="featured-badge">Frecuente</span>
      <span v-if="!allowed" class="locked-badge">Sin acceso</span>
    </div>
  </component>
</template>

<script setup lang="ts">
interface Props {
  to: string;
  icon: string;
  title: string;
  desc: string;
  themeColor: string;
  featured?: boolean;
  allowed: boolean;
}

defineProps<Props>();
</script>

<style scoped>
.module-card {
  --card-color: var(--md-sys-color-primary);
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 1.5rem;
  background-color: color-mix(in srgb, var(--md-sys-color-surface), transparent 8%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 24px;
  text-decoration: none;
  color: inherit;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-top: 4px solid var(--card-color);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, color-mix(in srgb, var(--card-color), transparent 95%) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.module-card:hover {
  transform: translateY(-8px) scale(1.03);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-color: var(--card-color);
  background-color: var(--md-sys-color-surface-container-low);
}

.module-card:hover .card-glow {
  opacity: 1;
}

.module-icon-container {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: color-mix(in srgb, var(--card-color), transparent 92%);
  color: var(--card-color);
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.module-card:hover .module-icon-container {
  transform: rotate(12deg) scale(1.15);
  background-color: color-mix(in srgb, var(--card-color), transparent 85%);
}

.module-icon-container .material-symbols-outlined {
  font-size: 2.25rem;
}

.card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 64px;
  padding: 0.25rem 0;
}

.module-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
  margin-bottom: 0.15rem;
  letter-spacing: -0.01em;
  line-height: 1.25;
}

.module-desc {
  font-size: 0.82rem;
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.4;
}

.card-arrow {
  color: var(--md-sys-color-outline-variant);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  opacity: 0.5;
  display: flex;
  align-items: center;
  min-height: 64px;
}

.module-card:hover .card-arrow {
  transform: translateX(8px);
  color: var(--card-color);
  opacity: 1;
}

.card-badges {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  flex-direction: row-reverse;
  gap: 0.25rem;
  pointer-events: none;
}

.featured-badge {
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.module-card.featured {
  background-color: var(--md-sys-color-surface-container);
}

.module-card--locked {
  opacity: 0.65;
  cursor: not-allowed;
  filter: grayscale(0.85);
}

.module-card--locked:hover {
  transform: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  filter: grayscale(1);
}

.locked-badge {
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

@media (max-width: 480px) {
  .module-card {
    border-top: none;
    border-left: 4px solid var(--card-color);
    border-radius: 16px;
    padding: 1rem;
  }
}
</style>
