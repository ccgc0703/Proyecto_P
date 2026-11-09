/** Notificación in-app del usuario autenticado (Fase 3). */
export interface Notificacion {
  id: string;
  usuarioId: string;
  /** Tipo canónico: CUENTA_CREADA, SOLICITUD_APROBACION, ... */
  tipo: string;
  titulo: string;
  cuerpo: string;
  /** Ruta interna a la que lleva el clic (p. ej. `/app/mi-progresion`). */
  link: string | null;
  /** Fecha ISO de lectura; `null` = no leída. */
  leidaEn: string | null;
  createdAt: string;
}

/** Resultado de `GET /notificaciones` (items + badge de no leídas). */
export interface ListadoNotificaciones {
  items: Notificacion[];
  total: number;
  noLeidas: number;
}
