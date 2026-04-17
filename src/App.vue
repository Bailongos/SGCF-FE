<!-- src/App.vue -->
<template>
  <div class="app" :class="{ dark: isDark }">
    <!-- Header Componentizado -->
    <Header v-if="auth.isAuthenticated" :isDark="isDark" @toggle-theme="toggleTheme" />

    <main class="app-main">
      <RouterView v-slot="{ Component, route }">
        <transition :css="false" @before-enter="onBeforeEnter" @enter="onEnter" @leave="onLeave" mode="out-in">
          <div class="route-view-shell" :key="route.fullPath">
            <component :is="Component" />
          </div>
        </transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from './stores/auth';
import Header from './components/layout/header.vue';

const auth = useAuthStore();
const isDark = ref(false);

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

// Animaciones de página optimizadas
const onBeforeEnter = (el: any) => {
  el.style.opacity = 0;
  el.style.transform = 'translateY(12px)';
};

const onEnter = (el: any, done: () => void) => {
  import('animejs').then(({ animate }) => {
    animate(el, {
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 500,
      easing: 'easeOutQuart'
    }).then(done);
  });
};

const onLeave = (el: any, done: () => void) => {
  import('animejs').then(({ animate }) => {
    animate(el, {
      opacity: 0,
      translateY: -12,
      duration: 300,
      easing: 'easeInQuart'
    }).then(done);
  });
};
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

/* Scrollbar personalizada minimalista */
:global(::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:global(::-webkit-scrollbar-track) {
  background: transparent;
}

:global(::-webkit-scrollbar-thumb) {
  background: var(--md-sys-color-surface-variant);
  border-radius: 10px;
}

:global(::-webkit-scrollbar-thumb:hover) {
  background: var(--md-sys-color-on-surface-variant);
}
</style>
