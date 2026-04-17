// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

import { PERMISSIONS } from "../security/permissions";

const LoginView = () => import("../views/LoginView.vue");
const RegisterView = () => import("../views/RegisterView.vue");
const InicioPage = () => import("../page/inicio.vue");
const AlumnosView = () => import("../views/AlumnosViews.vue");
const CarrerasView = () => import("../views/carrerasView.vue");
const CuentasView = () => import("../views/CuentasView.vue");
const MetodosPagoView = () => import("../views/metodosPago.vue");
const CiclosEscolares = () => import("../views/CiclosEscolares.vue");
const RolesView = () => import("../views/RolesView.vue");
const ObservacionesView = () => import("../views/ObservacionesView.vue");
const ConceptosView = () => import("../views/ConceptosView.vue");
const DashboardAlumnosView = () => import("../views/DashboardAlumnosView.vue");
const AnaliticaView = () => import("../views/AnaliticaView.vue");
const AdminUsuariosPermisosView = () => import("../views/AdminUsuariosPermisosView.vue");

const routes = [
  { path: "/login", name: "Login", component: LoginView },
  { path: "/registro", name: "Register", component: RegisterView },
  { 
    path: "/", 
    redirect: "/inicio",
    meta: { requiresAuth: true }
  },
  { path: "/inicio", component: InicioPage, meta: { requiresAuth: true, permission: PERMISSIONS.VIEW_INICIO } },
  {
    path: "/alumnos",
    component: AlumnosView,
    meta: { requiresAuth: true, permission: PERMISSIONS.VIEW_ALUMNOS, scopeByCareer: true },
  },
  {
    path: "/dashboard-alumnos",
    component: DashboardAlumnosView,
    meta: { requiresAuth: true, permission: PERMISSIONS.VIEW_DASHBOARD_ALUMNOS, scopeByCareer: true },
  },
  {
    path: "/analitica",
    component: AnaliticaView,
    meta: { requiresAuth: true, permission: PERMISSIONS.VIEW_DASHBOARD_ALUMNOS, scopeByCareer: true },
  },
  { path: "/carreras", component: CarrerasView, meta: { requiresAuth: true, permission: PERMISSIONS.VIEW_CARRERAS } },
  {
    path: "/cuentas",
    component: CuentasView,
    meta: { requiresAuth: true, permission: PERMISSIONS.VIEW_CUENTAS, scopeByCareer: true },
  },
  {
    path: "/metodos-pago",
    component: MetodosPagoView,
    meta: { requiresAuth: true, permission: PERMISSIONS.VIEW_METODOS_PAGO },
  },
  {
    path: "/ciclos-escolares",
    component: CiclosEscolares,
    meta: { requiresAuth: true, permission: PERMISSIONS.VIEW_CICLOS },
  },
  {
    path: "/admin/usuarios-permisos",
    component: AdminUsuariosPermisosView,
    meta: { requiresAuth: true, permission: PERMISSIONS.VIEW_ADMIN_USUARIOS },
  },
  {
    path: "/usuarios",
    redirect: "/admin/usuarios-permisos",
    meta: { requiresAuth: true, permission: PERMISSIONS.VIEW_ADMIN_USUARIOS },
  },
  { path: "/roles", component: RolesView, meta: { requiresAuth: true, permission: PERMISSIONS.VIEW_ROLES } },
  {
    path: "/observaciones",
    component: ObservacionesView,
    meta: { requiresAuth: true, permission: PERMISSIONS.VIEW_OBSERVACIONES, scopeByCareer: true },
  },
  { path: "/conceptos", component: ConceptosView, meta: { requiresAuth: true, permission: PERMISSIONS.VIEW_CONCEPTOS } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  
  // Asegurarse de que el store esté inicializado (restaurar de localStorage)
  if (!auth.user && (localStorage.getItem('user') || localStorage.getItem('token'))) {
    auth.initialize();
  }

  const isAuthenticated = auth.isAuthenticated;

  const requiredPermission = to.meta.permission as string | undefined;
  const scopeByCareer = Boolean(to.meta.scopeByCareer);

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: "Login" });
  } else if (to.meta.requiresAuth && !auth.isUserActive) {
    auth.logout();
    next({ name: "Login", query: { reason: "inactive" } });
  } else if (to.name === "Login" && isAuthenticated && auth.isUserActive) {
    next({ path: "/inicio" });
  } else if (to.name === "Register" && isAuthenticated && auth.isUserActive) {
    next({ path: "/inicio" });
  } else if (scopeByCareer && auth.isCoordinator && !auth.userCareerId) {
    next({ path: "/inicio" });
  } else if (requiredPermission && !auth.can(requiredPermission)) {
    next({ path: "/inicio" });
  } else {
    next();
  }
});

export default router;
