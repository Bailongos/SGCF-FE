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
  background: var(--md-sys-color-surface);
  border-radius: 24px;
  text-decoration: none;
  color: inherit;
  border: 1px solid var(--md-sys-color-outline);
  border-top: 4px solid var(--card-color);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.module-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, color-mix(in srgb, var(--card-color), transparent 92%) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  border-radius: 24px;
}

.card-glow {
  position: absolute;
  top: -100%;
  left: -100%;
  width: 300%;
  height: 300%;
  background: radial-gradient(circle at center, color-mix(in srgb, var(--card-color), transparent 96%) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
  animation: glowRotate 8s linear infinite;
}

@keyframes glowRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.module-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: var(--shadow-xl);
  border-color: var(--card-color);
}

.module-card:hover::before {
  opacity: 1;
}

.module-card:hover .card-glow {
  opacity: 1;
}

.module-icon-container {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, color-mix(in srgb, var(--card-color), transparent 90%) 0%, color-mix(in srgb, var(--card-color), transparent 96%) 100%);
  color: var(--card-color);
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.module-card:hover .module-icon-container {
  transform: scale(1.1) rotate(-5deg);
  background: linear-gradient(135deg, color-mix(in srgb, var(--card-color), transparent 80%) 0%, color-mix(in srgb, var(--card-color), transparent 90%) 100%);
}

.module-icon-container .material-symbols-outlined {
  font-size: 2rem;
  transition: transform 0.3s ease;
}

.module-card:hover .module-icon-container .material-symbols-outlined {
  transform: scale(1.15);
}

.card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 56px;
  padding: 0.25rem 0;
}

.module-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
  margin-bottom: 0.15rem;
  letter-spacing: -0.01em;
  line-height: 1.25;
  transition: color 0.3s ease;
}

.module-card:hover .module-title {
  color: var(--card-color);
}

.module-desc {
  font-size: 0.82rem;
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.4;
}

.card-arrow {
  color: var(--md-sys-color-outline);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  opacity: 0.3;
  display: flex;
  align-items: center;
  min-height: 56px;
}

.module-card:hover .card-arrow {
  transform: translateX(8px);
  color: var(--card-color);
  opacity: 1;
}

.card-badges {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  flex-direction: row-reverse;
  gap: 0.3rem;
  pointer-events: none;
}

.featured-badge {
  background: var(--gradient-primary);
  color: var(--md-sys-color-on-primary);
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.locked-badge {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.module-card.featured {
  background: linear-gradient(135deg, var(--md-sys-color-surface) 0%, color-mix(in srgb, var(--card-color), transparent 96%) 100%);
}

.module-card--locked {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.9);
}

.module-card--locked:hover {
  transform: none;
  box-shadow: var(--shadow-sm);
  filter: grayscale(1);
}

.module-card--locked:hover .module-title {
  color: var(--md-sys-color-on-surface);
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
