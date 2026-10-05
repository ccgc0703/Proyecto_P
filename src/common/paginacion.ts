/**
 * Helpers de paginación y búsqueda para listados.
 *
 * Diseño opt-in:
 *  - Sin `page`/`limit` el listado se comporta igual que siempre (lista completa)
 *    → retro-compatible con consumidores existentes (frontend, smokes, tests).
 *  - Con `page`/`limit` los servicios aplican skip/take y devuelven `total`
 *    para que el controlador agregue `meta: { page, limit, total, totalPages }`.
 *
 * El parseo es manual (estilo audit.controller) para no depender de DTOs con
 * ValidationPipe forbidNonWhitelisted.
 */

export interface OpcionesLista {
    page?: number;
    limit?: number;
    q?: string;
}

export interface MetaPagina {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const LIMITE_MAXIMO = 100;
const LIMITE_DEFECTO = 20;
const LONGITUD_MAX_Q = 100;

function parseEnteroPositivo(valor?: string): number | null {
    if (valor === undefined || valor === '') return null;
    const n = Number(valor);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
    return n;
}

/** Normaliza los query params crudos { page, limit, q } a opciones saneadas. */
export function resolverOpcionesLista(raw: {
    page?: string;
    limit?: string;
    q?: string;
}): OpcionesLista {
    const opts: OpcionesLista = {};

    const page = parseEnteroPositivo(raw.page);
    if (page !== null) opts.page = Math.max(1, page);

    const limit = parseEnteroPositivo(raw.limit);
    if (limit !== null) opts.limit = Math.min(LIMITE_MAXIMO, Math.max(1, limit));

    const q = (raw.q ?? '').trim().slice(0, LONGITUD_MAX_Q);
    if (q) opts.q = q;

    return opts;
}

/** true si el cliente pidió paginación explícita. */
export function hayPaginacion(opts: OpcionesLista): boolean {
    return opts.page !== undefined || opts.limit !== undefined;
}

export function paginaEfectiva(opts: OpcionesLista): { page: number; limit: number } {
    return { page: opts.page ?? 1, limit: opts.limit ?? LIMITE_DEFECTO };
}

export function rangoLista(opts: OpcionesLista): { skip: number; take: number } {
    const { page, limit } = paginaEfectiva(opts);
    return { skip: (page - 1) * limit, take: limit };
}

export function metaPagina(total: number, opts: OpcionesLista): MetaPagina {
    const { page, limit } = paginaEfectiva(opts);
    return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/**
 * Construye la cláusula OR de búsqueda case-insensitive para Prisma.
 * Devuelve null si no hay término de búsqueda.
 */
export function filtroBusqueda(q: string | undefined, campos: string[]): Record<string, any> | null {
    if (!q) return null;
    return {
        OR: campos.map((campo) => ({ [campo]: { contains: q, mode: 'insensitive' } })),
    };
}
