import { PERMISSIONS } from '../../types/auth';

interface ReglaRuta {
  /** Prefijo de ruta (se compara exacto o como prefijo de segmento) */
  ruta: string;
  /** Todos los permisos requeridos para ver el contenido de la ruta */
  permisos: string[];
}

/**
 * Permisos exigidos por ruta dentro de /app. El prefijo más largo gana:
 * `/app/manada/editar/123` usa la regla de `editar`, no la del listado.
 * Rutas sin regla (dashboard, perfil, mi-progresion) quedan abiertas:
 * su restricción vive en el `beforeLoad` del router o en la API (self-scope).
 */
export const REGLAS_RUTA: ReglaRuta[] = [
  { ruta: '/app/manada/nuevo', permisos: [PERMISSIONS.JOVEN_CREATE] },
  { ruta: '/app/tropa/nuevo', permisos: [PERMISSIONS.JOVEN_CREATE] },
  { ruta: '/app/clan/nuevo', permisos: [PERMISSIONS.JOVEN_CREATE] },
  { ruta: '/app/comunidad/nuevo', permisos: [PERMISSIONS.JOVEN_CREATE] },
  { ruta: '/app/manada/editar', permisos: [PERMISSIONS.JOVEN_UPDATE] },
  { ruta: '/app/tropa/editar', permisos: [PERMISSIONS.JOVEN_UPDATE] },
  { ruta: '/app/clan/editar', permisos: [PERMISSIONS.JOVEN_UPDATE] },
  { ruta: '/app/comunidad/editar', permisos: [PERMISSIONS.JOVEN_UPDATE] },
  { ruta: '/app/staff/nuevo', permisos: [PERMISSIONS.USER_CREATE] },
  { ruta: '/app/staff/editar', permisos: [PERMISSIONS.USER_UPDATE] },
  { ruta: '/app/staff/cuenta', permisos: [PERMISSIONS.USER_CREATE] },
  {
    ruta: '/app/manada',
    permisos: [PERMISSIONS.UNIDAD_VIEW, PERMISSIONS.JOVEN_VIEW],
  },
  {
    ruta: '/app/tropa',
    permisos: [PERMISSIONS.UNIDAD_VIEW, PERMISSIONS.JOVEN_VIEW],
  },
  {
    ruta: '/app/clan',
    permisos: [PERMISSIONS.UNIDAD_VIEW, PERMISSIONS.JOVEN_VIEW],
  },
  {
    ruta: '/app/comunidad',
    permisos: [PERMISSIONS.UNIDAD_VIEW, PERMISSIONS.JOVEN_VIEW],
  },
  { ruta: '/app/miembros', permisos: [PERMISSIONS.JOVEN_VIEW] },
  { ruta: '/app/staff', permisos: [PERMISSIONS.RBAC_VIEW] },
  { ruta: '/app/progresion', permisos: [PERMISSIONS.PROGRESION_VIEW] },
  { ruta: '/app/estructura', permisos: [PERMISSIONS.ORGANIZACION_VIEW] },
];

export const permisosDeRuta = (pathname: string): string[] | null => {
  const regla = [...REGLAS_RUTA]
    .sort((a, b) => b.ruta.length - a.ruta.length)
    .find(({ ruta }) => pathname === ruta || pathname.startsWith(`${ruta}/`));
  return regla ? regla.permisos : null;
};
