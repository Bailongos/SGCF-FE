<template>
  <header class="app-header">
    <div class="header-container">
      <div class="header-left">
        <div class="brand-container">
          <h1 class="header-title">SGCF</h1>
          <div class="brand-divider"></div>
          <span class="header-subtitle">Sistema de Control Financiero</span>
        </div>
      </div>

      <div class="header-actions">
        <button @click="$emit('toggle-theme')" class="theme-toggle" :title="isDark ? 'Modo claro' : 'Modo oscuro'">
          <span class="material-symbols-outlined">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
        </button>

        <div class="profile-container" ref="profileRef">
          <button @click="toggleMenu" class="profile-trigger" :class="{ 'profile-active': isMenuOpen }">
            <div class="profile-avatar">
              {{ auth.user?.username?.charAt(0).toUpperCase() }}
            </div>
            <div class="profile-info">
              <span class="profile-name">{{ auth.user?.username }}</span>
              <span class="profile-role">{{ roleLabel }}</span>
            </div>
            <span class="material-symbols-outlined arrow">expand_more</span>
          </button>

          <transition name="dropdown">
            <div v-if="isMenuOpen" class="profile-dropdown">
              <div class="dropdown-header">
                <div class="large-avatar">
                  {{ auth.user?.username?.charAt(0).toUpperCase() }}
                </div>
                <div class="user-details">
                  <span class="full-name">{{ auth.user?.username }}</span>
                  <span class="role-badge">{{ roleLabel }}</span>
                </div>
              </div>

              <div class="dropdown-divider"></div>

              <div class="dropdown-section">
                <RouterLink to="/inicio" class="dropdown-item" @click="isMenuOpen = false">
                  <span class="material-symbols-outlined">apps</span>
                  <span>Ir a Módulos</span>
                </RouterLink>

                <button @click="handleLogout" class="dropdown-item logout-item">
                  <span class="material-symbols-outlined">logout</span>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

defineProps<{
  isDark: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle-theme'): void;
}>();

const auth = useAuthStore();
const router = useRouter();

const roleLabel = computed(() => {
  const fromUser = String(auth.user?.rol_nombre ?? '').trim();
  if (fromUser) return fromUser;
  if (auth.isAdmin) return 'Administrador';
  if (auth.isCoordinator) return 'Coordinador';
  if (auth.isCashier) return 'Caja';
  return 'Usuario';
});

const isMenuOpen = ref(false);
const profileRef = ref<HTMLElement | null>(null);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const handleClickOutside = (event: MouseEvent) => {
  if (profileRef.value && !profileRef.value.contains(event.target as Node)) {
    isMenuOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

const handleLogout = () => {
  isMenuOpen.value = false;
  auth.logout();
  router.push('/login');
};
</script>

<style scoped>
.app-header {
  background: var(--md-sys-color-surface);
  border-bottom: 1px solid var(--md-sys-color-outline);
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
}

.header-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0.4rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.brand-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--md-sys-color-primary);
  margin: 0;
}

.brand-divider {
  width: 1px;
  height: 18px;
  background: var(--md-sys-color-outline);
  display: none;
}

.header-subtitle {
  font-size: 0.78rem;
  color: var(--md-sys-color-on-surface-variant);
  font-weight: 400;
  display: none;
}

@media (min-width: 1024px) {
  .brand-divider, .header-subtitle { display: block; }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  color: var(--md-sys-color-on-surface-variant);
  transition: all 0.12s ease;
}

.theme-toggle:hover {
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-primary);
}

.theme-toggle .material-symbols-outlined {
  font-size: 1.2rem;
}

.profile-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.4rem 0.25rem 0.65rem;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 0.12s ease;
}

.profile-trigger:hover {
  background: var(--md-sys-color-surface-container);
  border-color: var(--md-sys-color-outline);
}

.profile-active {
  background: var(--md-sys-color-surface-container);
  border-color: var(--md-sys-color-primary);
}

.profile-avatar {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 0.75rem;
  line-height: 1.25;
}

.profile-name {
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.profile-role {
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.62rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.profile-trigger .arrow {
  font-size: 1.1rem;
  color: var(--md-sys-color-on-surface-variant);
  transition: transform 0.15s ease;
}

.profile-active .arrow {
  transform: rotate(180deg);
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 260px;
  background: var(--md-sys-color-surface);
  border-radius: 8px;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--md-sys-color-outline);
  z-index: 1001;
  overflow: hidden;
  transform-origin: top right;
}

.dropdown-header {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
  background: var(--md-sys-color-surface-container);
}

.large-avatar {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
}

.full-name {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}

.role-badge {
  font-size: 0.7rem;
  color: var(--md-sys-color-on-primary);
  background: var(--md-sys-color-primary);
  padding: 0.15rem 0.7rem;
  border-radius: 4px;
  font-weight: 600;
}

.dropdown-divider {
  height: 1px;
  background: var(--md-sys-color-outline);
}

.dropdown-section {
  padding: 0.35rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  color: var(--md-sys-color-on-surface);
  text-decoration: none;
  font-size: 0.85rem;
  border-radius: 4px;
  transition: background 0.12s ease;
  cursor: pointer;
  border: none;
  width: 100%;
  background: transparent;
  text-align: left;
}

.dropdown-item:hover {
  background: var(--md-sys-color-surface-container);
}

.dropdown-item .material-symbols-outlined {
  font-size: 1.2rem;
  color: var(--md-sys-color-on-surface-variant);
}

.logout-item {
  color: var(--md-sys-color-error);
}

.logout-item:hover {
  background: var(--md-sys-color-error-container);
}

.logout-item:hover .material-symbols-outlined {
  color: var(--md-sys-color-error);
}

.dropdown-enter-active {
  animation: dropdownIn 0.15s ease-out;
}

.dropdown-leave-active {
  animation: dropdownIn 0.1s ease-in reverse;
}

@keyframes dropdownIn {
  from { opacity: 0; transform: scale(0.96) translateY(-4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@media (max-width: 768px) {
  .header-title { font-size: 1rem; }
}

@media (max-width: 600px) {
  .header-container { padding: 0.4rem 0.75rem; }
  .header-title { font-size: 0.9rem; }
  .profile-info { display: none; }
  .profile-trigger { padding: 0.2rem; }
  .profile-avatar {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }
  .theme-toggle {
    width: 40px;
    height: 40px;
  }
  .profile-dropdown {
    width: calc(100vw - 2rem);
    right: 0.5rem;
  }
}

@media (max-width: 480px) {
  .header-container { padding: 0.4rem 0.5rem; }
  .header-title { font-size: 0.85rem; }
  .brand-container { gap: 0.5rem; }
  .header-actions { gap: 0; }
}
</style>
