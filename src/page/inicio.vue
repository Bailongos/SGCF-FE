<!-- src/page/inicio.vue -->
<template>
  <section class="home">
    <header class="home-header">
      <div>
        <h1 class="home-title">Configracion de la informacion</h1>
        <p class="home-subtitle">
          Sistema Gestor de Control Financiero · Selecciona un módulo para comenzar.
        </p>
      </div>
    </header>

    <div class="modules-grid">
      <RouterLink to="/alumnos" class="module-card">
        <div class="module-icon">
          <span class="material-symbols-outlined">school</span>
        </div>
        <h2 class="module-title">Alumnos</h2>
        <p class="module-desc">
          Gestiona el registro, actualización y seguimiento de los alumnos.
        </p>
      </RouterLink>

      <RouterLink to="/carreras" class="module-card">
        <div class="module-icon">
          <span class="material-symbols-outlined">menu_book</span>
        </div>
        <h2 class="module-title">Carreras</h2>
        <p class="module-desc">
          Administra las carreras disponibles y su duración en semestres.
        </p>
      </RouterLink>

      <RouterLink to="/cuentas" class="module-card">
        <div class="module-icon">
          <span class="material-symbols-outlined">credit_card</span>
        </div>
        <h2 class="module-title">Cuentas por cobrar</h2>
        <p class="module-desc">
          Controla los adeudos por alumno, concepto y ciclo escolar.
        </p>
      </RouterLink>

      <RouterLink to="/metodos-pago" class="module-card">
        <div class="module-icon">
          <span class="material-symbols-outlined">payments</span>
        </div>
        <h2 class="module-title">Métodos de pago</h2>
        <p class="module-desc">
          Define y administra las formas de pago aceptadas en caja.
        </p>
      </RouterLink>

      <RouterLink to="/ciclos-escolares" class="module-card">
        <div class="module-icon">
          <span class="material-symbols-outlined">event</span>
        </div>
        <h2 class="module-title">Ciclos escolares</h2>
        <p class="module-desc">
          Define y gestiona los ciclos activos y anteriores.
        </p>
      </RouterLink>

      <RouterLink to="/usuarios" class="module-card">
        <div class="module-icon">
          <span class="material-symbols-outlined">group</span>
        </div>
        <h2 class="module-title">Usuarios</h2>
        <p class="module-desc">
          Administra las cuentas de usuario y sus permisos.
        </p>
      </RouterLink>

      <RouterLink to="/roles" class="module-card">
        <div class="module-icon">
          <span class="material-symbols-outlined">admin_panel_settings</span>
        </div>
        <h2 class="module-title">Roles</h2>
        <p class="module-desc">
          Gestiona los roles y niveles de acceso de los usuarios.
        </p>
      </RouterLink>

      <RouterLink to="/observaciones" class="module-card">
        <div class="module-icon">
          <span class="material-symbols-outlined">notes</span>
        </div>
        <h2 class="module-title">Observaciones</h2>
        <p class="module-desc">
          Registra y revisa las observaciones relacionadas con los alumnos.
        </p>
      </RouterLink>

      <RouterLink to="/conceptos" class="module-card">
        <div class="module-icon">
          <span class="material-symbols-outlined">sell</span>
        </div>
        <h2 class="module-title">Conceptos</h2>
        <p class="module-desc">
          Define los conceptos de cobro y sus características.
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
  font-family: 'Roboto', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.home-title {
  font-size: 1.9rem;
  font-weight: 500;
  letter-spacing: 0.03em;
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
  margin-bottom: 0.2rem;
}

/* Estilo "googlesco" para Material Symbols */
.material-symbols-outlined {
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
  font-size: 22px;
  color: #1a73e8;
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
