<!-- src/views/carrerasView.vue -->
<template>
  <div class="page g-page-animate">
    <div class="back-to-home">
      <RouterLink to="/inicio" custom v-slot="{ navigate }">
        <GoogleButton @click="navigate" variant="text" size="sm">
          <span class="material-symbols-outlined">arrow_back</span>
          Volver a inicio
        </GoogleButton>
      </RouterLink>
    </div>

    <CarrerasManager />
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import GoogleButton from '../components/ui/button.vue';
import CarrerasManager from '../components/mantenimiento/CarrerasManager.vue';
</script>

<style scoped>


.back-to-home {
  margin-bottom: 1rem;
}

.g-page-animate {
  animation: g-fade-in 200ms ease-out;
}

@keyframes g-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
