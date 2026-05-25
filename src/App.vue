<template>
  <div class="app" :class="{ dark: isDark }">
    <Header v-if="auth.isAuthenticated" :isDark="isDark" @toggle-theme="toggleTheme" />

    <main class="app-main">
      <RouterView v-slot="{ Component, route }">
        <transition name="g-route" mode="out-in">
          <div class="route-view-shell" :key="route.fullPath">
            <component :is="Component" />
          </div>
        </transition>
      </RouterView>
    </main>

    <GlobalToast />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useToast } from './composables/useToast';
import { useSessionTimeout } from './composables/useSessionTimeout';
import Header from './components/layout/header.vue';
import GlobalToast from './components/modal/GlobalToast.vue';

const auth = useAuthStore();
const router = useRouter();
const toast = useToast();
const isDark = ref(false);

useSessionTimeout(auth.isAuthenticated, () => {
  auth.logout();
  toast.info('Sesión expirada por inactividad.');
  router.push('/login');
});

const toggleTheme = () => {
  isDark.value = !isDark.value;
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

watch(isDark, (val) => {
  if (val) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, { immediate: true });

onMounted(() => {
  auth.initialize();
  const savedTheme = localStorage.getItem('theme');
  isDark.value = savedTheme === 'dark';
});
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--md-sys-color-background);
}

.app-main {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.route-view-shell {
  width: 100%;
}

.g-route-enter-active {
  animation: gRouteIn 0.2s ease-out;
}

.g-route-leave-active {
  animation: gRouteOut 0.12s ease-in;
}

@keyframes gRouteIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes gRouteOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

:global(::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:global(::-webkit-scrollbar-track) {
  background: transparent;
}

:global(::-webkit-scrollbar-thumb) {
  background: var(--md-sys-color-surface-variant);
  border-radius: 4px;
}

:global(::-webkit-scrollbar-thumb:hover) {
  background: var(--md-sys-color-on-surface-variant);
}
</style>
