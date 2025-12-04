<!-- src/App.vue -->
<template>
  <div class="app">
    <header class="app-header">
      <h1>SGCF - Sistema Gestor de Control Financiero</h1>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 1rem 2rem;
  background: #1f2933;
  color: #fff;
}

.app-main {
  flex: 1;
  padding: 1.5rem 2rem;
  background: #f3f4f6;
}
</style>
