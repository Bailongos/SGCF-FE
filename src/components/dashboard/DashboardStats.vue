<!-- src/components/dashboard/DashboardStats.vue -->
<template>
  <div class="stats-container">
    <div class="stat-card" v-for="stat in stats" :key="stat.label">
      <div class="stat-icon-wrapper" :style="{ backgroundColor: stat.bgColor }">
        <span class="material-symbols-outlined stat-icon" :style="{ color: stat.iconColor }">
          {{ stat.icon }}
        </span>
      </div>
      <div class="stat-info">
        <p class="stat-label">{{ stat.label }}</p>
        <h3 class="stat-value">{{ stat.value }}</h3>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  totalAlumnos: number;
  totalPendiente: number;
}>();

const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

const stats = computed(() => [
  {
    label: 'Total alumnos',
    value: props.totalAlumnos.toString(),
    icon: 'group',
    bgColor: 'var(--md-sys-color-primary-container)',
    iconColor: 'var(--md-sys-color-on-primary-container)',
  },
  {
    label: 'Pendiente total',
    value: formatMoney(props.totalPendiente),
    icon: 'payments',
    bgColor: 'var(--md-sys-color-error-container)',
    iconColor: 'var(--md-sys-color-on-error-container)',
  },
]);
</script>

<style scoped>
.stats-container {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--md-sys-color-surface-container-low);
  padding: 0.5rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--md-sys-color-outline-variant);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-width: 170px;
}

.stat-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--md-sys-elevation-1);
  background: var(--md-sys-color-surface-container);
}

.stat-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  font-size: 20px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  margin: 0;
  font-size: 0.7rem;
  color: var(--md-sys-color-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.stat-value {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--md-sys-color-on-surface);
}

@media (max-width: 600px) {
  .stat-card {
    flex: 1;
    min-width: 130px;
    padding: 0.4rem 0.75rem;
  }
}
</style>
