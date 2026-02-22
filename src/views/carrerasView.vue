<!-- src/views/CarrerasView.vue -->
<template>
  <section class="page g-page-animate">
    <div class="back-to-home">
      <RouterLink to="/inicio" custom v-slot="{ navigate }">
        <GoogleButton @click="navigate" color="#1a73e8" size="sm">
          <span class="material-symbols-outlined">arrow_back</span>
          Volver a inicio
        </GoogleButton>
      </RouterLink>
    </div>
    <CarrerasManager />
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import CarrerasManager from '../components/mantenimiento/CarrerasManager.vue';
import GoogleButton from '../components/ui/button.vue';
</script>

<style scoped>
.back-to-home {
  margin-bottom: 1.5rem;
}
</style>
