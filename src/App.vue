<!-- src/App.vue -->
<template>
  <div class="app">
    <!-- Header Componentizado -->
    <Header v-if="auth.isAuthenticated" />

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
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import Header from './components/layout/header.vue';

const auth = useAuthStore();

onMounted(() => {
  auth.initialize();
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
  background-color: #fcfcfc;
}

.app-main {
  flex: 1;
  padding: 1.5rem;
  /* Espaciado para el header sticky */
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
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
  background: #dadce0;
  border-radius: 10px;
}

:global(::-webkit-scrollbar-thumb:hover) {
  background: #bdc1c6;
}
</style>
