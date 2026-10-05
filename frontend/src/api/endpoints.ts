import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import {
  AprobacionResultado,
  EstadoIndicador,
  FilaJovenUnidad,
  ResumenProgresion,
  RespuestaIndicadores,
  ResultadoSolicitud,
} from '../types/progresion';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
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
  getAll: (unidadId?: string) =>
    api.get('/jovenes', { params: { unidadId } }).then(r => r.data.data),
  getById: (id: string) => api.get(`/jovenes/${id}`).then(r => r.data.data),
  getMiPerfil: () => api.get('/jovenes/mi-perfil').then(r => r.data.data),
  updateMiPerfil: (data: unknown) => api.patch('/jovenes/mi-perfil', data).then(r => r.data.data),
  create: (data: unknown) => api.post('/jovenes', data).then(r => r.data.data),
  createCuenta: (id: string, data: unknown) => api.post(`/jovenes/${id}/cuenta`, data).then(r => r.data.data),
  update: (id: string, data: unknown) => api.patch(`/jovenes/${id}`, data).then(r => r.data.data),
  delete: (id: string) => api.delete(`/jovenes/${id}`).then(r => r.data.data),
};

export const usuariosApi = {
  getAll: () => api.get('/users').then(r => r.data.data),
  getById: (id: string) => api.get(`/users/${id}`).then(r => r.data.data),
  create: (data: unknown) => api.post('/users', data).then(r => r.data.data),
  update: (id: string, data: unknown) => api.patch(`/users/${id}`, data).then(r => r.data.data),
  updateMe: (data: unknown) => api.patch('/users/me', data).then(r => r.data.data),
  changeMyPassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch('/users/me/password', data).then(r => r.data.data),
  delete: (id: string) => api.delete(`/users/${id}`).then(r => r.data.data),
};

export const unidadesApi = {
  getAll: () => api.get('/unidades').then(r => r.data.data),
  getById: (id: string) => api.get(`/unidades/${id}`).then(r => r.data.data),
  getPatrullas: (id: string) => api.get(`/unidades/${id}/patrullas`).then(r => r.data.data),
  createPatrulla: (unidadId: string, data: unknown) => api.post(`/unidades/${unidadId}/patrullas`, data).then(r => r.data.data),
  create: (data: unknown) => api.post('/unidades', data).then(r => r.data.data),
  update: (id: string, data: unknown) => api.patch(`/unidades/${id}`, data).then(r => r.data.data),
  delete: (id: string) => api.delete(`/unidades/${id}`).then(r => r.data.data),
};

export const rbacApi = {
  getRoles: () => api.get('/rbac/roles').then(r => r.data.data),
  getPermisos: () => api.get('/rbac/permisos').then(r => r.data.data),
  assignRole: (userId: string, roleId: string) =>
    api.post(`/rbac/usuarios/${userId}/roles`, { rolId: roleId }).then(r => r.data.data),
  revokeRole: (userId: string, roleId: string) =>
    api.delete(`/rbac/usuarios/${userId}/roles/${roleId}`).then(r => r.data.data),
};

export const administrativoApi = {
  getRepresentantes: () => api.get('/administrativo/representantes').then(r => r.data.data),
  createRepresentante: (data: unknown) => api.post('/administrativo/representantes', data).then(r => r.data.data),
  createFichaMedica: (data: unknown) => api.post('/administrativo/ficha-medica', data).then(r => r.data.data),
};

export const adultosApi = {
  getAll: () => api.get('/adultos').then(r => r.data),
  getById: (id: string) => api.get(`/adultos/${id}`).then(r => r.data),
  getMiPerfil: () => api.get('/adultos/mi-perfil').then(r => r.data),
  create: (data: unknown) => api.post('/adultos', data).then(r => r.data),
  update: (id: string, data: unknown) => api.patch(`/adultos/${id}`, data).then(r => r.data),
  createAccount: (id: string, data: unknown) => api.post(`/adultos/${id}/cuenta`, data).then(r => r.data),
};

export const fichaMedicaApi = {
  getByMiembro: (miembroId: string) => api.get(`/ficha-medica/miembro/${miembroId}`).then(r => r.data.data),
  getById: (id: string) => api.get(`/ficha-medica/${id}`).then(r => r.data.data),
  create: (data: unknown) => api.post('/ficha-medica', data).then(r => r.data.data),
  update: (id: string, data: unknown) => api.patch(`/ficha-medica/${id}`, data).then(r => r.data.data),
};

export const catalogoApi = {
  getAdelantos: (unidadId?: string) =>
    api.get('/catalogo/adelantos', { params: { unidadId } }).then(r => r.data.data),
};

export const organizacionApi = {
  getArbol: () => api.get('/organizacion/arbol').then(r => r.data.data),
  getNodos: (tipo?: string) =>
    api.get('/organizacion/nodos', { params: tipo ? { tipo } : undefined }).then(r => r.data.data),
  createNodo: (data: { tipo: string; nombre: string; padreId?: string }) =>
    api.post('/organizacion/nodos', data).then(r => r.data.data),
  updateNodo: (id: string, data: { nombre?: string; activo?: boolean }) =>
    api.patch(`/organizacion/nodos/${id}`, data).then(r => r.data.data),
  deleteNodo: (id: string) => api.delete(`/organizacion/nodos/${id}`).then(r => r.data.data),
  asignarUnidad: (unidadId: string, grupoId: string) =>
    api.patch(`/organizacion/unidades/${unidadId}/grupo`, { grupoId }).then(r => r.data.data),
  getCargosPermitidos: (tipo: string) =>
    api.get('/organizacion/cargos-permitidos', { params: { tipo } }).then(r => r.data.data),
  getCargos: (nodoId: string) =>
    api.get(`/organizacion/nodos/${nodoId}/cargos`).then(r => r.data.data),
  createCargo: (nodoId: string, data: { usuarioId: string; cargo: string }) =>
    api.post(`/organizacion/nodos/${nodoId}/cargos`, data).then(r => r.data.data),
  updateCargo: (id: string, data: { hasta?: string; activo?: boolean }) =>
    api.patch(`/organizacion/cargos/${id}`, data).then(r => r.data.data),
  deleteCargo: (id: string) => api.delete(`/organizacion/cargos/${id}`).then(r => r.data.data),
};

export const descargarArchivo = (nombre: string, blob: Blob) => {
  const url = window.URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.URL.revokeObjectURL(url);
};

const nombreDeDisposition = (header: unknown, fallback: string): string => {
  if (typeof header !== 'string') return fallback;
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match?.[1] ?? fallback;
};

const descargarXlsx = async (url: string, fallback: string): Promise<string> => {
  const respuesta = await api.get(url, { responseType: 'blob' });
  const nombre = nombreDeDisposition(respuesta.headers['content-disposition'], fallback);
  descargarArchivo(nombre, respuesta.data as Blob);
  return nombre;
};

export const progresionApi = {
  getResumen: (miembroId: string): Promise<ResumenProgresion> =>
    api.get(`/progresion/jovenes/${miembroId}/resumen`).then(r => r.data.data),
  getIndicadores: (miembroId: string): Promise<RespuestaIndicadores> =>
    api.get(`/progresion/jovenes/${miembroId}/indicadores`).then(r => r.data.data),
  setEstado: (
    miembroId: string,
    indicadorId: string,
    data: { estado: EstadoIndicador; observaciones?: string },
  ) =>
    api
      .patch(`/progresion/jovenes/${miembroId}/indicadores/${indicadorId}`, data)
      .then(r => r.data.data),
  iniciar: (miembroId: string, adelantoId: string) =>
    api
      .post(`/progresion/jovenes/${miembroId}/adelantos/${adelantoId}/iniciar`)
      .then(r => r.data.data),
  solicitar: (progresionId: string): Promise<ResultadoSolicitud> =>
    api.post(`/progresion/progresiones/${progresionId}/solicitar`).then(r => r.data.data),
  aprobar: (progresionId: string): Promise<AprobacionResultado> =>
    api.post(`/progresion/progresiones/${progresionId}/aprobar`).then(r => r.data.data),
  rechazar: (progresionId: string, motivo?: string) =>
    api
      .post(`/progresion/progresiones/${progresionId}/rechazar`, { motivo })
      .then(r => r.data.data),
  jovenesDeUnidad: (unidadId: string): Promise<FilaJovenUnidad[]> =>
    api.get(`/progresion/unidades/${unidadId}/jovenes`).then(r => r.data.data),
  exportJoven: (miembroId: string) =>
    descargarXlsx(
      `/progresion/jovenes/${miembroId}/export.xlsx`,
      'cuadro-adelanto-joven.xlsx',
    ),
  exportUnidad: (unidadId: string) =>
    descargarXlsx(
      `/progresion/unidades/${unidadId}/export.xlsx`,
      'cuadro-adelanto-unidad.xlsx',
    ),
};
