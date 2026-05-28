<!-- src/page/inicio.vue -->
<template>
  <section class="page home-hub g-page-animate">
    <header class="hub-header">
      <div class="header-text-group">
        <h1 class="hub-title">Centro de Módulos</h1>
        <p class="hub-subtitle">
          Bienvenido, selecciona una de las herramientas para gestionar el sistema.
        </p>
      </div>
    </header>

    <div class="modules-grid">
      <ModuleCard 
        v-for="module in modulesWithAccess" 
        :key="module.to" 
        v-bind="module" 
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { PERMISSIONS } from '../security/permissions';
import ModuleCard from '../components/home/ModuleCard.vue';

interface ModuleItem {
  to: string;
  icon: string;
  title: string;
  desc: string;
  themeColor: string;
  featured?: boolean;
  permission: string;
}

const modules: ModuleItem[] = [
  {
    to: '/dashboard-alumnos',
    icon: 'dashboard',
    title: 'Gestión Integrada',
    desc: 'Vista unificada de alumnos, ciclos y finanzas.',
    themeColor: 'var(--module-color-blue)',
    featured: true,
    permission: PERMISSIONS.VIEW_DASHBOARD_ALUMNOS,
  },
  {
    to: '/analitica',
    icon: 'monitoring',
    title: 'Analítica',
    desc: 'Gráficas estratégicas para decisiones de cobranza y riesgo.',
    themeColor: 'var(--module-color-green)',
    permission: PERMISSIONS.VIEW_DASHBOARD_ALUMNOS,
  },
  {
    to: '/alumnos',
    icon: 'school',
    title: 'Alumnos',
    desc: 'Gestión de matrículas y expedientes.',
    themeColor: 'var(--module-color-blue)',
    permission: PERMISSIONS.VIEW_ALUMNOS,
  },
  {
    to: '/cuentas',
    icon: 'credit_card',
    title: 'Cuentas por cobrar',
    desc: 'Control de adeudos y cobranza.',
    themeColor: 'var(--module-color-red)',
    permission: PERMISSIONS.VIEW_CUENTAS,
  },
  {
    to: '/ciclos-escolares',
    icon: 'event',
    title: 'Ciclos Escolares',
    desc: 'Configuración de períodos académicos.',
    themeColor: 'var(--module-color-green)',
    permission: PERMISSIONS.VIEW_CICLOS,
  },
  {
    to: '/carreras',
    icon: 'menu_book',
    title: 'Planes de Estudio',
    desc: 'Administración de carreras y semestres.',
    themeColor: 'var(--module-color-orange)',
    permission: PERMISSIONS.VIEW_CARRERAS,
  },
  {
    to: '/metodos-pago',
    icon: 'payments',
    title: 'Métodos de Pago',
    desc: 'Configuración de formas de pago aceptadas.',
    themeColor: 'var(--module-color-blue)',
    permission: PERMISSIONS.VIEW_METODOS_PAGO,
  },
  {
    to: '/conceptos',
    icon: 'sell',
    title: 'Conceptos',
    desc: 'Catálogo de trámites y costos.',
    themeColor: 'var(--module-color-purple)',
    permission: PERMISSIONS.VIEW_CONCEPTOS,
  },
  {
    to: '/admin/usuarios-permisos',
    icon: 'group',
    title: 'Usuarios y Permisos',
    desc: 'Gestión administrativa de roles, alcance y accesos SSO.',
    themeColor: 'var(--module-color-gray)',
    permission: PERMISSIONS.VIEW_ADMIN_USUARIOS,
  },
  {
    to: '/roles',
    icon: 'admin_panel_settings',
    title: 'Roles',
    desc: 'Permisos y políticas del sistema.',
    themeColor: 'var(--module-color-gray)',
    permission: PERMISSIONS.VIEW_ROLES,
  },
  {
    to: '/observaciones',
    icon: 'notes',
    title: 'Observaciones',
    desc: 'Seguimiento y bitácora operativa.',
    themeColor: 'var(--module-color-blue)',
    permission: PERMISSIONS.VIEW_OBSERVACIONES,
  },
];

const auth = useAuthStore();

const modulesWithAccess = computed(() => {
  return modules.map((module) => ({
    ...module,
    allowed: auth.can(module.permission),
  }));
});

onMounted(() => {
  import('animejs').then(({ animate }) => {
    animate('.module-card', {
      opacity: [0, 1],
      scale: [0.92, 1],
      translateY: [35, 0],
      delay: (_el: any, i: number) => i * 45,
      duration: 1000,
      easing: 'easeOutElastic(1, .85)'
    });

    animate('.hub-header', {
      opacity: [0, 1],
      translateX: [-40, 0],
      duration: 1200,
      easing: 'easeOutQuart'
    });
  });
});
</script>

<style scoped>
/* .home-hub inherits .page styles for centering */
.home-hub {
  padding-top: 2rem;
}

.hub-header {
  margin-bottom: 3rem;
  padding-left: 0.5rem;
}

.hub-title {
  font-size: clamp(1.8rem, 5vw, 2.75rem);
  font-weight: 800;
  color: var(--md-sys-color-on-background);
  letter-spacing: -0.025em;
  margin-bottom: 0.75rem;
}

.hub-subtitle {
  font-size: 1.15rem;
  color: var(--md-sys-color-on-surface-variant);
  max-width: 600px;
  line-height: 1.6;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1.75rem;
}

@media (max-width: 1200px) {
  .modules-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
  }
}

@media (max-width: 768px) {
  .home-hub { padding: 1rem 0; }
  .hub-header { margin-bottom: 2rem; }
  .modules-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .modules-grid { grid-template-columns: 1fr; }
  .hub-title { text-align: center; }
  .hub-subtitle { text-align: center; margin: 0 auto; }
}
</style>
