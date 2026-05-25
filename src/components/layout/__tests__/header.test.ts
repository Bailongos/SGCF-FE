import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../../../stores/auth';
import Header from '../header.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'Login', component: { template: '<div>Login</div>' } },
    { path: '/inicio', name: 'Inicio', component: { template: '<div>Inicio</div>' } },
  ],
});

beforeEach(() => {
  setActivePinia(createPinia());
  localStorage.clear();
});

describe('Header component', () => {
  it('renders brand title and subtitle', () => {
    const wrapper = mount(Header, {
      props: { isDark: false },
      global: { plugins: [router, createPinia()] },
    });

    expect(wrapper.text()).toContain('SGCF');
    expect(wrapper.text()).toContain('Sistema de Control Financiero');
  });

  it('renders theme toggle button', () => {
    const wrapper = mount(Header, {
      props: { isDark: false },
      global: { plugins: [router, createPinia()] },
    });

    expect(wrapper.find('.theme-toggle').exists()).toBe(true);
  });

  it('shows dark_mode icon when isDark is false', () => {
    const wrapper = mount(Header, {
      props: { isDark: false },
      global: { plugins: [router, createPinia()] },
    });

    expect(wrapper.find('.theme-toggle').text()).toContain('dark_mode');
  });

  it('shows light_mode icon when isDark is true', () => {
    const wrapper = mount(Header, {
      props: { isDark: true },
      global: { plugins: [router, createPinia()] },
    });

    expect(wrapper.find('.theme-toggle').text()).toContain('light_mode');
  });

  it('emits toggle-theme on theme button click', async () => {
    const wrapper = mount(Header, {
      props: { isDark: false },
      global: { plugins: [router, createPinia()] },
    });

    await wrapper.find('.theme-toggle').trigger('click');
    expect(wrapper.emitted('toggle-theme')).toBeTruthy();
  });

  it('shows username in profile', () => {
    const pinia = createPinia();
    const auth = useAuthStore(pinia);
    auth.user = { id_usuario: 1, username: 'admin', id_rol: 1, id_carrera: null, activo: true } as any;
    auth.token = 'token';

    const wrapper = mount(Header, {
      props: { isDark: false },
      global: { plugins: [router, pinia] },
    });

    expect(wrapper.text()).toContain('admin');
  });

  it('shows role label for admin', () => {
    const pinia = createPinia();
    const auth = useAuthStore(pinia);
    auth.user = { id_usuario: 1, username: 'admin', id_rol: 1, id_carrera: null, activo: true } as any;
    auth.token = 'token';

    const wrapper = mount(Header, {
      props: { isDark: false },
      global: { plugins: [router, pinia] },
    });

    expect(wrapper.text()).toContain('Administrador');
  });

  it('shows dropdown menu on profile click', async () => {
    const pinia = createPinia();
    const auth = useAuthStore(pinia);
    auth.user = { id_usuario: 1, username: 'admin', id_rol: 1, id_carrera: null, activo: true } as any;
    auth.token = 'token';

    const wrapper = mount(Header, {
      props: { isDark: false },
      global: { plugins: [router, pinia] },
    });

    expect(wrapper.find('.profile-dropdown').exists()).toBe(false);

    await wrapper.find('.profile-trigger').trigger('click');
    expect(wrapper.find('.profile-dropdown').exists()).toBe(true);
  });

  it('shows Ir a Módulos and Cerrar Sesión in dropdown', async () => {
    const pinia = createPinia();
    const auth = useAuthStore(pinia);
    auth.user = { id_usuario: 1, username: 'admin', id_rol: 1, id_carrera: null, activo: true } as any;
    auth.token = 'token';

    const wrapper = mount(Header, {
      props: { isDark: false },
      global: { plugins: [router, pinia] },
    });

    await wrapper.find('.profile-trigger').trigger('click');
    expect(wrapper.text()).toContain('Ir a Módulos');
    expect(wrapper.text()).toContain('Cerrar Sesión');
  });
});
