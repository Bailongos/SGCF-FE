<!-- src/page/inicio.vue -->
<template>
  <section class="home-hub g-page-animate">
    <header class="hub-header">
      <div class="header-text-group">
        <h1 class="hub-title">Centro de Módulos</h1>
        <p class="hub-subtitle">
          Bienvenido, selecciona una de las herramientas para gestionar el sistema.
        </p>
      </div>
    </header>

    <div class="modules-grid">
      <template v-for="module in modulesWithAccess" :key="module.to">
        <RouterLink v-if="module.allowed" :to="module.to" class="module-card" :class="{ 'featured': module.featured }"
          :style="{ 'border-top-color': module.color }">
          <div class="module-icon-container" :style="{ backgroundColor: module.bgColor }">
            <span class="material-symbols-outlined" :style="{ color: module.color }">
              {{ module.icon }}
            </span>
          </div>
          <div class="card-content">
            <h2 class="module-title">{{ module.title }}</h2>
            <p class="module-desc">{{ module.desc }}</p>
          </div>
          <div class="card-arrow">
            <span class="material-symbols-outlined">chevron_right</span>
          </div>
          <span v-if="module.featured" class="featured-badge">Frecuente</span>
        </RouterLink>

        <article v-else class="module-card module-card--locked" :class="{ 'featured': module.featured }"
          :style="{ 'border-top-color': module.color }" tabindex="0" role="button" aria-disabled="true"
          @keydown.enter.prevent="void 0">
            <div class="module-icon-container" :style="{ backgroundColor: module.bgColor }">
              <span class="material-symbols-outlined" :style="{ color: module.color }">
                {{ module.icon }}
              </span>
            </div>
            <div class="card-content">
              <h2 class="module-title">{{ module.title }}</h2>
              <p class="module-desc">{{ module.desc }}</p>
            </div>
            <div class="card-arrow">
              <span class="material-symbols-outlined">chevron_right</span>
            </div>
            <span v-if="module.featured" class="featured-badge">Frecuente</span>
            <span class="locked-badge">Sin acceso</span>
          </article>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';

interface ModuleItem {
  to: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
  bgColor: string;
  featured?: boolean;
  roleRequired?: string[];
}

type ModuleCard = ModuleItem & {
  allowed: boolean;
};

const modules: ModuleItem[] = [
  {
    to: '/dashboard-alumnos',
    icon: 'dashboard',
    title: 'Gestión Integrada',
    desc: 'Vista unificada de alumnos, ciclos y finanzas.',
    color: '#1a73e8',
    bgColor: '#e8f0fe',
    featured: true,
    roleRequired: ['Administrador', 'Coordinador', 'Caja']
  },
  {
    to: '/alumnos',
    icon: 'school',
    title: 'Alumnos',
    desc: 'Gestión de matrículas y expedientes.',
    color: '#1a73e8',
    bgColor: '#e8f0fe',
    roleRequired: ['Administrador', 'Coordinador']
  },
  {
    to: '/cuentas',
    icon: 'credit_card',
    title: 'Cuentas por cobrar',
    desc: 'Control de adeudos y cobranza.',
    color: '#ea4335',
    bgColor: '#fce8e6',
    roleRequired: ['Administrador', 'Caja']
  },
  {
    to: '/ciclos-escolares',
    icon: 'event',
    title: 'Ciclos Escolares',
    desc: 'Configuración de períodos académicos.',
    color: '#34a853',
    bgColor: '#e6f4ea',
    roleRequired: ['Administrador']
  },
  {
    to: '/carreras',
    icon: 'menu_book',
    title: 'Planes de Estudio',
    desc: 'Administración de carreras y semestres.',
    color: '#f9ab00',
    bgColor: '#fef7e0',
    roleRequired: ['Administrador']
  },
  {
    to: '/metodos-pago',
    icon: 'payments',
    title: 'Métodos de Pago',
    desc: 'Configuración de formas de pago aceptadas.',
    color: '#1a73e8',
    bgColor: '#e8f0fe',
    roleRequired: ['Administrador', 'Caja']
  },
  {
    to: '/conceptos',
    icon: 'sell',
    title: 'Conceptos',
    desc: 'Catálogo de trámites y costos.',
    color: '#7b1fa2',
    bgColor: '#f3e5f5',
    roleRequired: ['Administrador']
  },
  {
    to: '/usuarios',
    icon: 'group',
    title: 'Usuarios',
    desc: 'Control de cuentas y administración.',
    color: '#5f6368',
    bgColor: '#f1f3f4',
    roleRequired: ['Administrador']
  },
  {
    to: '/roles',
    icon: 'admin_panel_settings',
    title: 'Roles',
    desc: 'Permisos y políticas del sistema.',
    color: '#5f6368',
    bgColor: '#f1f3f4',
    roleRequired: ['Administrador']
  },
  {
    to: '/observaciones',
    icon: 'notes',
    title: 'Observaciones',
    desc: 'Seguimiento y bitácora operativa.',
    color: '#1a73e8',
    bgColor: '#e8f0fe'
  },
];

const auth = useAuthStore();

const modulesWithAccess = computed<ModuleCard[]>(() => {
  const role = auth.user?.rol_nombre;

  return modules.map((module) => {
    const allowed = auth.isAdmin || !module.roleRequired?.length || (!!role && module.roleRequired.includes(role));

    return {
      ...module,
      allowed,
    };
  });
});

onMounted(() => {
  import('animejs').then(({ animate }) => {
    animate('.module-card', {
      opacity: [0, 1],
      scale: [0.95, 1],
      translateY: [20, 0],
      delay: (_el: any, i: number) => i * 60,
      duration: 800,
      easing: 'easeOutQuart'
    });
  });
});
</script>

<style scoped>
.home-hub {
  padding: 1rem 0;
  max-width: 1400px;
  margin: 0 auto;
}

.hub-header {
  margin-bottom: 2.5rem;
  padding-left: 0.5rem;
}

.hub-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #202124;
  letter-spacing: -0.015em;
  margin-bottom: 0.5rem;
}

.hub-subtitle {
  font-size: 1.1rem;
  color: #5f6368;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.module-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 20px;
  text-decoration: none;
  color: inherit;
  border: 1px solid #e8eaed;
  border-top: 4px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.1), 0 1px 3px 1px rgba(60, 64, 67, 0.05);
  position: relative;
  overflow: hidden;
  opacity: 0;
  /* Controlado por animación */
}

.module-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 24px rgba(60, 64, 67, 0.12);
  border-color: #dadce0;
}

.module-icon-container {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.module-card:hover .module-icon-container {
  transform: rotate(5deg);
}

.module-icon-container .material-symbols-outlined {
  font-size: 2rem;
}

.card-content {
  flex-grow: 1;
}

.module-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: #202124;
  margin-bottom: 0.25rem;
}

.module-desc {
  font-size: 0.875rem;
  color: #5f6368;
  line-height: 1.4;
}

.card-arrow {
  color: #bdc1c6;
  transition: transform 0.3s ease, color 0.3s ease;
}

.module-card:hover .card-arrow {
  transform: translateX(4px);
  color: #1a73e8;
}

.featured-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: #e8f0fe;
  color: #1a73e8;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.module-card.featured {
  background-color: #fafbfc;
}

.module-card--locked {
  opacity: 0.72;
  cursor: not-allowed;
}

.module-card--locked:hover {
  transform: none;
  border-color: #e8eaed;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.1), 0 1px 3px 1px rgba(60, 64, 67, 0.05);
}

.module-card--locked:hover .module-icon-container {
  transform: none;
}

.module-card--locked .card-arrow {
  color: #dadce0;
}

.locked-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background-color: #fce8e6;
  color: #d93025;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

@media (max-width: 640px) {
  .modules-grid {
    grid-template-columns: 1fr;
  }

  .hub-title {
    font-size: 1.75rem;
  }
}
</style>
