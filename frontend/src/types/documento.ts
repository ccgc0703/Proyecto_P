/** Categorías de la biblioteca (espejo de `CategoriaNormativa` en Prisma). */
export const CATEGORIAS_NORMATIVA = [
  'LEY_PROMESA',
  'REGLAMENTO',
  'ACTA',
  'CIRCULAR',
  'OTRO',
] as const;

export type CategoriaNormativa = (typeof CATEGORIAS_NORMATIVA)[number];

export const ETIQUETA_CATEGORIA: Record<CategoriaNormativa, string> = {
  LEY_PROMESA: 'Ley y Promesa',
  REGLAMENTO: 'Reglamento',
  ACTA: 'Acta',
  CIRCULAR: 'Circular',
  OTRO: 'Otro',
};

/** Documento de la biblioteca (GET /normativa/documentos). */
export interface Documento {
  id: string;
  titulo: string;
  categoria: CategoriaNormativa;
  descripcion: string | null;
  /** Ruta relativa en el servidor; la descarga va por `/documentos/:id/archivo`. */
  archivoUrl: string;
  mimeType: string | null;
  tamano: number | null;
  nombreOriginal: string | null;
  version: number;
  vigente: boolean;
  /** `null` = documento nacional. */
  unidadId: string | null;
  createdAt: string;
  updatedAt: string;
  Unidad?: { id: string; nombre: string; tipo: string | null } | null;
}

export interface NuevoDocumento {
  titulo: string;
  categoria: CategoriaNormativa;
  descripcion?: string;
  archivo: File;
}

export interface CambiosDocumento {
  titulo?: string;
  categoria?: CategoriaNormativa;
  descripcion?: string;
  vigente?: boolean;
  version?: number;
}
