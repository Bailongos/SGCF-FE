<template>
  <div class="page g-page-animate">
    <!-- Botón para volver a Inicio -->
    <div class="back-to-home">
      <RouterLink to="/inicio" custom v-slot="{ navigate }">
        <GoogleButton @click="navigate" color="#1a73e8" size="sm">
          <span class="material-symbols-outlined">arrow_back</span>
          Volver a inicio
        </GoogleButton>
      </RouterLink>
    </div>

    <!-- Container manager -->
    <ConceptosManager />
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import GoogleButton from '../components/ui/button.vue';
import ConceptosManager from '../components/mantenimiento/ConceptosManager.vue';
</script>

<style scoped>
.back-to-home {
  margin-bottom: 0.5rem;
}

/* Animación suave tipo Google */
.g-page-animate {
  animation: g-fade-in 180ms ease-out;
}

@keyframes g-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
