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
import { ListadoNotificaciones } from '../types/notificacion';
import {
  CambiosDocumento,
  CategoriaNormativa,
  Documento,
  NuevoDocumento,
} from '../types/documento';
import { AdultoFormacion, CambiosFormacion, Formacion, NuevaFormacion } from '../types/formacion';
import { CambiosDatosScout, DatosScout, NuevoDatosScout } from '../types/datosScout';
import {
  CambiosInscripcionPrograma,
  NuevaInscripcionPrograma,
  ProgramaMiembro,
  ProgramaMundial,
} from '../types/programaMundial';

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

export const eventosApi = {
  getPlanificaciones: (params?: { unidadId?: string; estado?: string }) =>
    api.get('/eventos/planificaciones', { params }).then((r) => r.data.data),
  getPlanificacion: (id: string) =>
    api.get(`/eventos/planificaciones/${id}`).then((r) => r.data.data),
  createPlanificacion: (data: unknown) =>
    api.post('/eventos/planificaciones', data).then((r) => r.data.data),
  updatePlanificacion: (id: string, data: unknown) =>
    api.patch(`/eventos/planificaciones/${id}`, data).then((r) => r.data.data),
  deletePlanificacion: (id: string) =>
    api.delete(`/eventos/planificaciones/${id}`).then((r) => r.data.data),
  getActividades: (params?: { planificacionId?: string; unidadId?: string; estado?: string; tipo?: string }) =>
    api.get('/eventos/actividades', { params }).then((r) => r.data.data),
  getActividad: (id: string) => api.get(`/eventos/actividades/${id}`).then((r) => r.data.data),
  createActividad: (planificacionId: string, data: unknown) =>
    api.post(`/eventos/planificaciones/${planificacionId}/actividades`, data).then((r) => r.data.data),
  updateActividad: (id: string, data: unknown) =>
    api.patch(`/eventos/actividades/${id}`, data).then((r) => r.data.data),
  deleteActividad: (id: string) =>
    api.delete(`/eventos/actividades/${id}`).then((r) => r.data.data),
  getPlanilla: (actividadId: string) =>
    api.get(`/eventos/actividades/${actividadId}/asistencias`).then((r) => r.data.data),
  guardarAsistencias: (actividadId: string, registros: unknown[]) =>
    api
      .post(`/eventos/actividades/${actividadId}/asistencias`, { registros })
      .then((r) => r.data.data),
  updateAsistencia: (asistenciaId: string, data: unknown) =>
    api.patch(`/eventos/asistencias/${asistenciaId}`, data).then((r) => r.data.data),
  getAsistenciasUnidad: (unidadId: string, params?: { desde?: string; hasta?: string }) =>
    api.get(`/eventos/unidades/${unidadId}/asistencias`, { params }).then((r) => r.data.data),
  /** Listado de asistencia de la actividad en PDF (Fase 7a). */
  listadoAsistenciaPdf: (actividadId: string) =>
    descargarRemoto(`/pdf/asistencia/${actividadId}`, 'listado-asistencia.pdf'),
};

export const dashboardApi = {
  getResumen: () => api.get('/dashboard/resumen').then((r) => r.data.data),
};

export const notificacionesApi = {
  /** Lista las notificaciones propias + badge `noLeidas` (Fase 3). */
  listar: (params?: { soloNoLeidas?: boolean; page?: number; limit?: number }) =>
    api
      .get('/notificaciones', { params })
      .then((r): ListadoNotificaciones => ({
        items: r.data.data,
        total: r.data.meta?.total ?? r.data.data.length,
        noLeidas: r.data.meta?.noLeidas ?? 0,
      })),
  marcarLeida: (id: string) =>
    api.post(`/notificaciones/${id}/leer`).then((r) => r.data.data),
  marcarTodas: () => api.post('/notificaciones/leer-todas').then((r) => r.data),
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

/**
 * Descarga un binario del API (xlsx/pdf) y lo dispara en el navegador.
 * El nombre sale del `content-disposition`; si el proxy no lo expone se
 * usa el `fallback`.
 */
const descargarRemoto = async (url: string, fallback: string): Promise<string> => {
  const respuesta = await api.get(url, { responseType: 'blob' });
  const nombre = nombreDeDisposition(respuesta.headers['content-disposition'], fallback);
  descargarArchivo(nombre, respuesta.data as Blob);
  return nombre;
};

export const normativaApi = {
  listar: (params?: {
    categoria?: CategoriaNormativa;
    vigente?: 'true' | 'false';
    unidadId?: string;
    q?: string;
  }): Promise<Documento[]> =>
    api.get('/normativa/documentos', { params }).then((r) => r.data.data as Documento[]),

  obtener: (id: string): Promise<Documento> =>
    api.get(`/normativa/documentos/${id}`).then((r) => r.data.data as Documento),

  /**
   * Multipart: el header JSON por defecto de la instancia convertiría el
   * FormData en JSON (axios ≥1.13). Se fuerza multipart y axios deja que el
   * navegador añada el boundary.
   */
  crear: ({ archivo, ...data }: NuevoDocumento): Promise<Documento> => {
    const form = new FormData();
    form.append('file', archivo);
    form.append('titulo', data.titulo);
    form.append('categoria', data.categoria);
    if (data.descripcion) form.append('descripcion', data.descripcion);

    return api
      .post('/normativa/documentos', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data as Documento);
  },

  actualizar: (id: string, data: CambiosDocumento): Promise<Documento> =>
    api.patch(`/normativa/documentos/${id}`, data).then((r) => r.data.data as Documento),

  eliminar: (id: string): Promise<void> =>
    api.delete(`/normativa/documentos/${id}`).then(() => undefined),

  descargar: async (id: string, fallback = 'documento'): Promise<string> => {
    const respuesta = await api.get(`/normativa/documentos/${id}/archivo`, {
      responseType: 'blob',
    });
    const nombre = nombreDeDisposition(respuesta.headers['content-disposition'], fallback);
    descargarArchivo(nombre, respuesta.data as Blob);
    return nombre;
  },
};

export const formacionApi = {
  /** `GET /formacion` responde con el array directo (compatibilidad). */
  listar: (): Promise<Formacion[]> =>
    api.get('/formacion').then((r) => r.data as Formacion[]),

  listarPorAdulto: (adultoId: string): Promise<Formacion[]> =>
    api.get(`/formacion/adulto/${adultoId}`).then((r) => r.data as Formacion[]),

  /** Adultos del ámbito con formacion:view (no requiere `user:view`). */
  listarAdultos: (): Promise<AdultoFormacion[]> =>
    api.get('/formacion/adultos').then((r) => r.data.data as AdultoFormacion[]),

  obtener: (id: string): Promise<Formacion> =>
    api.get(`/formacion/${id}`).then((r) => r.data.data as Formacion),

  crear: (data: NuevaFormacion): Promise<Formacion> =>
    api.post('/formacion', data).then((r) => r.data.data as Formacion),

  actualizar: (id: string, data: CambiosFormacion): Promise<Formacion> =>
    api.patch(`/formacion/${id}`, data).then((r) => r.data.data as Formacion),

  eliminar: (id: string): Promise<void> =>
    api.delete(`/formacion/${id}`).then(() => undefined),
};

export const datosScoutApi = {
  /** `GET /datos-scout` responde con el array directo (compatibilidad). */
  listar: (): Promise<DatosScout[]> => api.get('/datos-scout').then((r) => r.data as DatosScout[]),

  /** `GET /datos-scout/miembro/:id` responde con el objeto directo (compatibilidad). */
  getByMiembro: (miembroId: string): Promise<DatosScout> =>
    api.get(`/datos-scout/miembro/${miembroId}`).then((r) => r.data as DatosScout),

  crear: (data: NuevoDatosScout): Promise<DatosScout> =>
    api.post('/datos-scout', data).then((r) => r.data.data as DatosScout),

  /** Upsert: funciona aunque el miembro aún no tenga expediente. */
  actualizar: (miembroId: string, data: CambiosDatosScout): Promise<DatosScout> =>
    api.patch(`/datos-scout/miembro/${miembroId}`, data).then((r) => r.data.data as DatosScout),

  /** Carnet del miembro en PDF (Fase 7a). */
  carnetPdf: (miembroId: string) =>
    descargarRemoto(`/pdf/carnet/${miembroId}`, 'carnet-scout.pdf'),
};

export const programasMundialesApi = {
  /** `GET /programas-mundiales/catalogo` responde con el array directo. */
  catalogo: (): Promise<ProgramaMundial[]> =>
    api.get('/programas-mundiales/catalogo').then((r) => r.data as ProgramaMundial[]),

  /** Listado global de enlaces (filtrado por unidad en el backend). */
  listar: (): Promise<ProgramaMiembro[]> =>
    api.get('/programas-mundiales').then((r) => r.data as ProgramaMiembro[]),

  /** `GET /programas-mundiales/miembro/:id` responde con el array directo. */
  listarPorMiembro: (miembroId: string): Promise<ProgramaMiembro[]> =>
    api
      .get(`/programas-mundiales/miembro/${miembroId}`)
      .then((r) => r.data as ProgramaMiembro[]),

  crear: (data: NuevaInscripcionPrograma): Promise<ProgramaMiembro> =>
    api.post('/programas-mundiales', data).then((r) => r.data.data as ProgramaMiembro),

  actualizar: (id: string, data: CambiosInscripcionPrograma): Promise<ProgramaMiembro> =>
    api.patch(`/programas-mundiales/${id}`, data).then((r) => r.data.data as ProgramaMiembro),

  eliminar: (id: string): Promise<void> =>
    api.delete(`/programas-mundiales/${id}`).then(() => undefined),
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
    descargarRemoto(
      `/progresion/jovenes/${miembroId}/export.xlsx`,
      'cuadro-adelanto-joven.xlsx',
    ),
  exportUnidad: (unidadId: string) =>
    descargarRemoto(
      `/progresion/unidades/${unidadId}/export.xlsx`,
      'cuadro-adelanto-unidad.xlsx',
    ),
  /** Constancia de progresión del joven en PDF (Fase 7a). */
  constanciaPdf: (miembroId: string) =>
    descargarRemoto(`/pdf/constancia/${miembroId}`, 'constancia-progresion.pdf'),
};
