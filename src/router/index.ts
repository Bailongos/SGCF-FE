// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

import LoginView from "../views/LoginView.vue";
import InicioPage from "../page/inicio.vue";
import AlumnosView from "../views/AlumnosViews.vue";
import CarrerasView from "../views/carrerasView.vue";
import CuentasView from "../views/CuentasView.vue";
import MetodosPagoView from "../views/metodosPago.vue";
import CiclosEscolares from "../views/CiclosEscolares.vue";
import UsuariosView from "../views/UsuariosView.vue";
import RolesView from "../views/RolesView.vue";
import ObservacionesView from "../views/ObservacionesView.vue";
import ConceptosView from "../views/ConceptosView.vue";
import DashboardAlumnosView from "../views/DashboardAlumnosView.vue";

const routes = [
  { path: "/login", name: "Login", component: LoginView },
  { 
    path: "/", 
    redirect: "/inicio",
    meta: { requiresAuth: true }
  },
  { path: "/inicio", component: InicioPage, meta: { requiresAuth: true } },
  {
    path: "/alumnos",
    component: AlumnosView,
    meta: { requiresAuth: true, allowedRoles: ["Administrador", "Coordinador"] },
  },
  {
    path: "/dashboard-alumnos",
    component: DashboardAlumnosView,
    meta: { requiresAuth: true, allowedRoles: ["Administrador", "Coordinador", "Caja"] },
  },
  { path: "/carreras", component: CarrerasView, meta: { requiresAuth: true, allowedRoles: ["Administrador"] } },
  { path: "/cuentas", component: CuentasView, meta: { requiresAuth: true, allowedRoles: ["Administrador", "Caja"] } },
  {
    path: "/metodos-pago",
    component: MetodosPagoView,
    meta: { requiresAuth: true, allowedRoles: ["Administrador", "Caja"] },
  },
  {
    path: "/ciclos-escolares",
    component: CiclosEscolares,
    meta: { requiresAuth: true, allowedRoles: ["Administrador"] },
  },
  { path: "/usuarios", component: UsuariosView, meta: { requiresAuth: true, allowedRoles: ["Administrador"] } },
  { path: "/roles", component: RolesView, meta: { requiresAuth: true, allowedRoles: ["Administrador"] } },
  { path: "/observaciones", component: ObservacionesView, meta: { requiresAuth: true } },
  { path: "/conceptos", component: ConceptosView, meta: { requiresAuth: true, allowedRoles: ["Administrador"] } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  
  // Asegurarse de que el store esté inicializado (restaurar de localStorage)
  if (!auth.user && localStorage.getItem('user')) {
    auth.initialize();
  }

  const isAuthenticated = auth.isAuthenticated;

  const allowedRoles = to.meta.allowedRoles as string[] | undefined;
  const userRole = auth.user?.rol_nombre;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: "Login" });
  } else if (to.name === "Login" && isAuthenticated) {
    next({ path: "/inicio" });
  } else if (allowedRoles?.length && !auth.isAdmin && (!userRole || !allowedRoles.includes(userRole))) {
    next({ path: "/inicio" });
  } else {
    next();
  }
});

export default router;
