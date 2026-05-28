<!-- src/page/inicio.vue -->
<template>
  <section class="page home-hub g-page-animate">
    <header class="hub-header">
      <div class="header-content">
        <div class="header-logo">
          <img src="@/assets/Logotipo-UADEC-vertical.webp" alt="UAdeC" class="logo-img" />
        </div>
        <div class="header-text-group">
          <h1 class="hub-title">Centro de Módulos</h1>
          <p class="hub-subtitle">
            Bienvenido, {{ auth.user?.username }}, selecciona una herramienta para gestionar el sistema.
          </p>
        </div>
        <div class="header-avatar">
          <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="Avatar" class="avatar-img" />
          <span v-else class="avatar-fallback">{{ auth.user?.username?.charAt(0).toUpperCase() }}</span>
        </div>
      </div>
    </header>

    <div class="modules-container">
      <div class="modules-featured" v-if="featuredModules.length > 0">
        <h2 class="section-title">Destacados</h2>
        <div class="featured-modules-grid">
          <ModuleCard 
            v-for="module in featuredModules" 
            :key="module.to" 
            v-bind="module" 
            class="module-card--featured"
          />
        </div>
      </div>
      
      <div class="modules-regular">
        <h2 class="section-title">Todos los Módulos</h2>
        <div class="modules-grid">
          <ModuleCard 
            v-for="module in regularModules" 
            :key="module.to" 
            v-bind="module" 
          />
        </div>
      </div>
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

const featuredModules = computed(() => {
  return modulesWithAccess.value.filter(module => module.featured && module.allowed);
});

const regularModules = computed(() => {
  return modulesWithAccess.value.filter(module => !module.featured && module.allowed);
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.header-logo {
  flex-shrink: 0;
}

.logo-img {
  height: 60px;
  width: auto;
  display: block;
}

.header-text-group {
  flex: 1 1 200px;
}

.hub-title {
  font-size: clamp(1.8rem, 5vw, 2.75rem);
  font-weight: 800;
  color: var(--md-sys-color-on-background);
  letter-spacing: -0.025em;
  margin-bottom: 0.5rem;
}

.hub-subtitle {
  font-size: 1.15rem;
  color: var(--md-sys-color-on-surface-variant);
  max-width: 600px;
  line-height: 1.6;
  margin: 0;
}

.header-avatar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--md-sys-color-outline);
}

.avatar-fallback {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.modules-container {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 0 1rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--md-sys-color-on-background);
  margin: 2rem 0 1.5rem;
  padding: 0 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 24px;
  background: var(--md-sys-color-primary);
  border-radius: 2px;
}

.featured-modules-grid,
.modules-grid {
  display: grid;
  gap: 1.75rem;
}

.featured-modules-grid {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  margin-bottom: 3rem;
}

.modules-grid {
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
}

.module-card--featured {
  transform: scale(1.02);
  box-shadow: var(--shadow-lg);
}

.module-card--featured:hover {
  transform: translateY(-8px) scale(1.04);
  box-shadow: var(--shadow-xl);
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .featured-modules-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
  
  .modules-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
  }
}

@media (max-width: 768px) {
  .home-hub { padding: 1rem 0; }
  .hub-header { 
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .hub-title { 
    font-size: clamp(1.5rem, 6vw, 2.2rem);
  }
  
  .featured-modules-grid,
  .modules-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .section-title {
    font-size: 1.25rem;
    margin: 1.5rem 0 1rem;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .featured-modules-grid,
  .modules-grid {
    grid-template-columns: 1fr;
  }
  
  .hub-title { text-align: center; }
  .hub-subtitle { text-align: center; margin: 0 auto; }
  
  .header-text-group {
    text-align: center;
  }
  
  .section-title {
    text-align: center;
  }
  
  .section-title::before {
    margin: 0 auto 0.5rem;
  }
}
</style>
