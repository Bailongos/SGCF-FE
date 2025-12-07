import { createRouter, createWebHistory } from 'vue-router';
import InicioPage from '../page/inicio.vue';
import AlumnosView from '../views/AlumnosViews.vue';
import CarrerasView from '../views/carrerasView.vue';
import CuentasView from '../views/CuentasView.vue';
import metodosPago from '../views/metodosPago.vue';
import CiclosEscolares from '../views/CiclosEscolares.vue';
import UsuariosView from '../views/UsuariosView.vue';
import RolesView from '../views/RolesView.vue';
import ObservacionesView from '../views/ObservacionesView.vue';
import ConceptosView from '../views/ConceptosView.vue';

const routes = [
  { path: '/', redirect: '/inicio' },
  { path: '/inicio', component: InicioPage },
  { path: '/alumnos', component: AlumnosView },
  { path: '/carreras', component: CarrerasView },
  { path: '/cuentas', component: CuentasView },
  { path: '/metodos-pago', component: metodosPago },
  { path: '/ciclos-escolares', component: CiclosEscolares },
  { path: '/usuarios', component: UsuariosView },
  { path: '/roles', component: RolesView },
  { path: '/observaciones', component: ObservacionesView },
  { path: '/conceptos', component: ConceptosView },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
