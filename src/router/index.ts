// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

import InicioPage from '../page/inicio.vue';
import AlumnosView from '../views/AlumnosViews.vue';
import CarrerasView from '../views/CarrerasView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'inicio',
    component: InicioPage,
  },
  {
    path: '/alumnos',
    name: 'alumnos',
    component: AlumnosView,
  },
  {
    path: '/carreras',
    name: 'carreras',
    component: CarrerasView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
