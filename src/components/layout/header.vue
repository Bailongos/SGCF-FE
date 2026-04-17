<!-- src/components/layout/header.vue -->
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

                    <!-- Dropdown Menu -->
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
    background-color: var(--md-sys-color-surface);
    backdrop-filter: blur(12px) saturate(180%);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
    border-bottom: 1px solid var(--md-sys-color-surface-variant);
    position: sticky;
    top: 0;
    z-index: 1000;
    transition: all 0.3s ease;
    width: 100%;
}

.header-container {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0.6rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.header-left {
    display: flex;
    align-items: center;
}

.brand-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.header-title {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--md-sys-color-primary);
    letter-spacing: -0.02em;
    margin: 0;
}

.brand-divider {
    width: 1px;
    height: 20px;
    background-color: var(--md-sys-color-surface-variant);
    display: none;
}

.header-subtitle {
    font-size: 0.85rem;
    color: var(--md-sys-color-on-surface-variant);
    font-weight: 400;
    display: none;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--md-sys-color-on-surface-variant);
    transition: all 0.2s;
    box-shadow: none;
}

.theme-toggle:hover {
    background-color: var(--md-sys-color-surface-variant);
    color: var(--md-sys-color-primary);
}

.theme-toggle .material-symbols-outlined {
    font-size: 1.4rem;
}

@media (min-width: 1024px) {
    .brand-divider,
    .header-subtitle {
        display: block;
    }
}

@media (max-width: 600px) {
    .header-container {
        padding: 0.6rem 1rem;
    }
}

.profile-trigger {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.35rem 0.5rem 0.35rem 1rem;
    border-radius: 999px;
    border: 1px solid transparent;
    background-color: transparent;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.profile-trigger:hover {
    background-color: var(--md-sys-color-surface-variant);
}

.profile-active {
    background-color: var(--md-sys-color-surface-variant);
    border-color: var(--md-sys-color-surface-variant);
}

.profile-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.95rem;
}

.profile-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    font-size: 0.8rem;
    line-height: 1.25;
}

.profile-name {
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
}

.profile-role {
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.profile-trigger .arrow {
    font-size: 1.2rem;
    color: var(--md-sys-color-on-surface-variant);
    transition: transform 0.2s;
}

.profile-active .arrow {
    transform: rotate(180deg);
}

.profile-dropdown {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    width: 280px;
    background: var(--md-sys-color-surface);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    border: 1px solid var(--md-sys-color-surface-variant);
    z-index: 1001;
    overflow: hidden;
    transform-origin: top right;
}

.dropdown-header {
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
    background-color: var(--md-sys-color-surface-variant);
}

.large-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    font-weight: 600;
}

.full-name {
    display: block;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
    margin-bottom: 0.2rem;
}

.role-badge {
    font-size: 0.75rem;
    color: var(--md-sys-color-on-primary);
    background-color: var(--md-sys-color-primary);
    padding: 0.2rem 0.75rem;
    border-radius: 999px;
    font-weight: 500;
}

.dropdown-divider {
    height: 1px;
    background-color: var(--md-sys-color-surface-variant);
}

.dropdown-section {
    padding: 0.5rem;
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem 1rem;
    color: var(--md-sys-color-on-surface);
    text-decoration: none;
    font-size: 0.9rem;
    border-radius: 12px;
    transition: all 0.2s;
    cursor: pointer;
    border: none;
    width: 100%;
    background: transparent;
    text-align: left;
}

.dropdown-item:hover {
    background-color: var(--md-sys-color-surface-variant);
    color: var(--md-sys-color-primary);
}

.dropdown-item .material-symbols-outlined {
    font-size: 1.4rem;
    color: var(--md-sys-color-on-surface-variant);
}

.dropdown-item:hover .material-symbols-outlined {
    color: var(--md-sys-color-primary);
}

.logout-item:hover {
    background-color: var(--md-sys-color-error);
    color: var(--md-sys-color-on-error);
}

.logout-item:hover .material-symbols-outlined {
    color: var(--md-sys-color-on-error);
}

/* Transitions */
.dropdown-enter-active {
    animation: dropdown-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dropdown-leave-active {
    animation: dropdown-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) reverse;
}

@keyframes dropdown-in {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(-10px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}
</style>
