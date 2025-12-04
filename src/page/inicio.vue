<!-- src/page/inicio.vue -->
<template>
  <section class="home">
    <header class="home-header">
      <div>
        <h1 class="home-title">SGCF</h1>
        <p class="home-subtitle">
          Sistema Gestor de Control Financiero · Selecciona un módulo para comenzar.
        </p>
      </div>
    </header>

    <div class="modules-grid">
      <RouterLink to="/alumnos" class="module-card">
        <div class="module-icon">👩‍🎓</div>
        <h2 class="module-title">Alumnos</h2>
        <p class="module-desc">
          Gestiona el registro, actualización y seguimiento de los alumnos.
        </p>
      </RouterLink>

      <RouterLink to="/carreras" class="module-card">
        <div class="module-icon">📚</div>
        <h2 class="module-title">Carreras</h2>
        <p class="module-desc">
          Administra las carreras disponibles y su duración en semestres.
        </p>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts"></script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.home-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #202124;
}

.home-subtitle {
  font-size: 0.95rem;
  color: #5f6368;
  margin-top: 0.25rem;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 260px));
  gap: 1.25rem;
}

.module-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1rem 1.1rem;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.15);
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.15s ease, transform 0.15s ease,
    background-color 0.15s ease;
}

.module-card:hover {
  box-shadow: 0 3px 8px rgba(60, 64, 67, 0.25);
  transform: translateY(-1px);
  background-color: #f8f9fa;
}

.module-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #e8f0fe;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  margin-bottom: 0.2rem;
}

.module-title {
  font-size: 1rem;
  font-weight: 500;
  color: #202124;
}

.module-desc {
  font-size: 0.85rem;
  color: #5f6368;
}
</style>
