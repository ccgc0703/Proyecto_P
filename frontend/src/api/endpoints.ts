import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Solo redirigir si no estamos ya en la página de login
      // para evitar el bucle infinito con TanStack Router
      if (!window.location.pathname.includes('/login')) {
        useAuthStore.getState().logout();
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const miembrosApi = {
  getAll: (unidad?: string) =>
    api.get('/jovenes', { params: { unidad } }).then(r => r.data.data),
  getById: (id: string) => api.get(`/jovenes/${id}`).then(r => r.data.data),
  create: (data: unknown) => api.post('/jovenes', data).then(r => r.data.data),
  update: (id: string, data: unknown) => api.patch(`/jovenes/${id}`, data).then(r => r.data.data),
  delete: (id: string) => api.delete(`/jovenes/${id}`).then(r => r.data.data),
};

export const usuariosApi = {
  getAll: () => api.get('/users').then(r => r.data.data),
  getById: (id: string) => api.get(`/users/${id}`).then(r => r.data.data),
  create: (data: unknown) => api.post('/users', data).then(r => r.data.data),
  update: (id: string, data: unknown) => api.patch(`/users/${id}`, data).then(r => r.data.data),
  delete: (id: string) => api.delete(`/users/${id}`).then(r => r.data.data),
};

export const unidadesApi = {
  getAll: () => api.get('/unidades').then(r => r.data.data),
  getById: (id: string) => api.get(`/unidades/${id}`).then(r => r.data.data),
  getPatrullas: (id: string) => api.get(`/unidades/${id}/patrullas`).then(r => r.data.data),
  create: (data: unknown) => api.post('/unidades', data).then(r => r.data.data),
  update: (id: string, data: unknown) => api.patch(`/unidades/${id}`, data).then(r => r.data.data),
  delete: (id: string) => api.delete(`/unidades/${id}`).then(r => r.data.data),
};

export const rbacApi = {
  getRoles: () => api.get('/rbac/roles').then(r => r.data.data),
  getPermisos: () => api.get('/rbac/permisos').then(r => r.data.data),
  assignRole: (userId: string, roleId: string) =>
    api.post('/rbac/assign-role', { userId, roleId }).then(r => r.data.data),
};

export const administrativoApi = {
  getRepresentantes: () => api.get('/administrativo/representantes').then(r => r.data.data),
  createRepresentante: (data: unknown) => api.post('/administrativo/representantes', data).then(r => r.data.data),
  createFichaMedica: (data: unknown) => api.post('/administrativo/ficha-medica', data).then(r => r.data.data),
};

export const adultosApi = {
  getAll: () => api.get('/adultos').then(r => r.data),
  getById: (id: string) => api.get(`/adultos/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/adultos', data).then(r => r.data),
  update: (id: string, data: unknown) => api.patch(`/adultos/${id}`, data).then(r => r.data),
  createAccount: (id: string, data: unknown) => api.post(`/adultos/${id}/cuenta`, data).then(r => r.data),
};
