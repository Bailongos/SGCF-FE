// src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor para añadir el token y x-user-id a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // El backend exige estos headers en todas las peticiones (según walkthrough)
  let userId = '0';
  let carreraId = '0';
  
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user.id_usuario) userId = user.id_usuario.toString();
      // Si id_carrera es null (admin), enviamos '0' o simplemente no lo sobreescribimos
      if (user.id_carrera) carreraId = user.id_carrera.toString();
    } catch (e) {
      console.error('Error parsing user for headers', e);
    }
  }
  
  config.headers['x-user-id'] = userId;
  config.headers['x-user-carrera'] = carreraId;
  
  return config;
});

// Interceptor para manejar errores globales (ej: 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error.config?.url ?? '');
    const isAuthSignInRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/google') ||
      requestUrl.includes('/auth/microsoft');
    
    if (error.response?.status === 401 && !isAuthSignInRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
