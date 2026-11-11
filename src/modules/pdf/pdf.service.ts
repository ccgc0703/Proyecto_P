import { Injectable, NotFoundException } from '@nestjs/common';
/**
 * `pdfmake` exporta una instancia con métodos que usan `this`: hay que
 * llamarlos como propiedades del módulo (nunca desestructurados).
 */
import * as pdfmake from 'pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { UnitPolicy } from '../../common/policies/unit.policy';
import type { JovenExport } from '../progresion/export.service';

/** Usuario enriquecido por JwtStrategy (req.user). */
export interface Actor {
    id: string;
    roles: string[];
    unidadId?: string | null;
    nodoId?: string | null;
    miembroId?: string | null;
}

/** Datos del carnet: query propia con ABAC fail-closed por unidad. */
export interface CarnetDatos {
    miembroId: string;
    nombres: string;
    apellidos: string;
    fechaNacimiento: Date;
    unidad: string;
    grupo: string | null;
    patrulla: string | null;
    cargo: string | null;
    fechaIngreso: Date | null;
}

/** Planilla de asistencia (salida de `EventosService.listarAsistenciasActividad`). */
export interface PlanillaAsistenciaPdf {
    actividad: {
        id: string;
        titulo: string;
        fecha: Date;
        tipo: string;
        estado: string;
        planificacionId: string | null;
        planificacion: { id: string; titulo: string; unidadId: string | null; estado: string } | null;
    };
    registros: Array<{
        miembroId: string;
        nombres: string;
        apellidos: string;
        unidadId: string | null;
        asistenciaId: string | null;
        estado: string | null;
        observacion: string | null;
    }>;
}

// ── Fuentes ──────────────────────────────────────────────────────────────

/**
 * `pdfmake/fonts/Roboto` no tiene declaraciones de tipos: se resuelve en
 * runtime (exporta `{ Roboto: { normal, bold, … } }`) y sólo se usan sus
 * rutas TTF para armar el diccionario de fuentes.
 */
const Roboto = (require('pdfmake/fonts/Roboto') as {
    Roboto: { normal: string; bold: string; italics: string; bolditalics: string };
}).Roboto;

/** Normaliza una ruta: minúsculas, separadores `/` y barra inicial. */
const normalizarRuta = (ruta: string): string =>
    `/${ruta.replace(/\\/g, '/').toLowerCase().replace(/^\/+/, '')}`;

/** Directorio real (normalizado) de las fuentes que empaqueta pdfmake. */
const DIR_FUENTES = normalizarRuta(path.dirname(Roboto.normal));

/**
 * Política de lectura local (whitelist): sólo se permite leer las TTF de
 * `node_modules/pdfmake/fonts/`. Una política deny-all rompería el render
 * (pdfmake abre Roboto al construir el PDF), por eso se normalizan los
 * separadores antes de comparar: en Windows las rutas llegan con `\`.
 */
export const permitirSoloFuentes = (archivo: string): boolean => {
    const ruta = normalizarRuta(archivo);
    return ruta.startsWith(DIR_FUENTES) || ruta.includes('/node_modules/pdfmake/fonts/');
};

/** Los PDF no descargan recursos remotos: toda URL queda bloqueada. */
export const denegarUrl = (_url: string): boolean => false;

let listo = false;

/** Fuentes + políticas de acceso: idempotente (el servicio puede crear varios). */
function prepararPdf(): void {
    if (listo) return;
    pdfmake.setFonts({ Roboto });
    pdfmake.setLocalAccessPolicy(permitirSoloFuentes);
    pdfmake.setUrlAccessPolicy(denegarUrl);
    listo = true;
}

// ── Etiquetas de dominio ─────────────────────────────────────────────────

const ESTADO_ASISTENCIA_LABEL: Record<string, string> = {
    PRESENTE: 'Presente',
    AUSENTE: 'Ausente',
    JUSTIFICADO: 'Justificado',
};

const ESTADO_PROGRESION_LABEL: Record<string, string> = {
    EN_CURSO: 'En curso',
    SOLICITADA: 'Solicitada',
    APROBADA: 'Aprobada',
    RECHAZADA: 'Rechazada',
};

const TIPO_ACTIVIDAD_LABEL: Record<string, string> = {
    REUNION: 'Reunión',
    CAMPAMENTO: 'Campamento',
    EXCURSION: 'Excursión',
    SERVICIO_COMUNITARIO: 'Servicio comunitario',
    TALLER: 'Taller',
    CEREMONIA: 'Ceremonia',
    COMPETENCIA: 'Competencia',
    OTRO: 'Otro',
};

const COLOR_TITULO = '#1f4e79';
const COLOR_TEXTO = '#374151';
const COLOR_SUAVE = '#6b7280';
const COLOR_REJILLA = '#e5e7eb';

/** Rejilla suave para las tablas de datos (sin líneas verticales). */
const REJILLA = {
    hLineColor: () => COLOR_REJILLA,
    vLineColor: () => COLOR_REJILLA,
    hLineWidth: () => 0.5,
    vLineWidth: () => 0,
    paddingLeft: () => 6,
    paddingRight: () => 6,
    paddingTop: () => 4,
    paddingBottom: () => 4,
    fillColor: (fila: number) => (fila % 2 === 0 ? '#f8fafc' : null),
} as const;

@Injectable()
export class PdfService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly unitPolicy: UnitPolicy,
    ) {
        prepararPdf();
    }

    // ── ABAC fail-closed (carnet) ────────────────────────────────────────

    /**
     * - alcance null → visión global.
     * - alcance array → fuera de esas unidades responde 404 (no filtra ni
     *   revela que el miembro existe).
     */
    private async asegurarVisibilidad(unidadId: string | null | undefined, user?: Actor): Promise<void> {
        if (!user || !unidadId) return;
        const alcance = await this.unitPolicy.unidadesAlcance(user);
        if (alcance !== null && !alcance.includes(unidadId)) {
            throw new NotFoundException('Miembro no encontrado');
        }
    }

    /** Miembro + unidad + grupo + expediente scout para el carnet. */
    async getDatosCarnet(miembroId: string, user: Actor): Promise<CarnetDatos> {
        const miembro = await this.prisma.miembro.findFirst({
            where: { id: miembroId, deletedAt: null },
            select: {
                id: true,
                nombres: true,
                apellidos: true,
                fechaNacimiento: true,
                Unidad: { select: { id: true, nombre: true, Grupo: { select: { nombre: true } } } },
                DatosScout: {
                    select: {
                        cargoActual: true,
                        fechaIngreso: true,
                        Patrulla: { select: { nombre: true } },
                    },
                },
            },
        });
        if (!miembro) throw new NotFoundException('Miembro no encontrado');
        await this.asegurarVisibilidad(miembro.Unidad.id, user);

        return {
            miembroId: miembro.id,
            nombres: miembro.nombres,
            apellidos: miembro.apellidos,
            fechaNacimiento: miembro.fechaNacimiento,
            unidad: miembro.Unidad.nombre,
            grupo: miembro.Unidad.Grupo?.nombre ?? null,
            patrulla: miembro.DatosScout?.Patrulla?.nombre ?? null,
            cargo: miembro.DatosScout?.cargoActual ?? null,
            fechaIngreso: miembro.DatosScout?.fechaIngreso ?? null,
        };
    }

    // ── Puntos de entrada ────────────────────────────────────────────────

    async renderConstancia(datos: JovenExport): Promise<Buffer> {
        return pdfmake.createPdf(this.docConstancia(datos)).getBuffer();
    }

    async renderCarnet(datos: CarnetDatos): Promise<Buffer> {
        return pdfmake.createPdf(this.docCarnet(datos)).getBuffer();
    }

    async renderAsistencia(planilla: PlanillaAsistenciaPdf): Promise<Buffer> {
        return pdfmake.createPdf(this.docAsistencia(planilla)).getBuffer();
    }

    // ── Constancia de progresión (A4) ────────────────────────────────────

    private docConstancia(datos: JovenExport): TDocumentDefinitions {
        const cuerpo: any[] = [
            { text: 'SISTEMA DE GESTIÓN SCOUT', style: 'emisor' },
            { text: 'Constancia de Progresión', style: 'titulo' },
            {
                table: {
                    widths: [140, '*'],
                    body: [
                        ['Miembro', `${datos.apellidos}, ${datos.nombres}`],
                        ['Unidad', datos.unidad || '—'],
                        ['Etapas', datos.etapas || '—'],
                        ['Adelanto actual', datos.adelantoActual?.nombre ?? 'Sin adelanto iniciado'],
                        ['Nacimiento', this.fecha(datos.fechaNacimiento)],
                        ['Emitida el', this.fecha(datos.generadoEn)],
                    ].map(([etiqueta, valor]) => [
                        { text: etiqueta, style: 'etiqueta' },
                        { text: valor, color: COLOR_TEXTO },
                    ]),
                },
                layout: REJILLA,
                margin: [0, 12, 0, 0],
            },
        ];

        if (datos.evaluacion) {
            const ev = datos.evaluacion;
            cuerpo.push({ text: 'Evaluación actual', style: 'seccion' });
            cuerpo.push({
                table: {
                    widths: [140, '*'],
                    body: [
                        ['Indicadores completados', `${ev.completados} de ${ev.poolTotal} (${ev.porcentajeActual}%)`],
                        ['Requeridos para el adelanto', `${ev.requerido}`],
                        ['Faltantes', `${ev.faltantes}`],
                        [
                            'Situación',
                            ev.apto
                                ? 'Apto para solicitar el adelanto'
                                : `No apto${ev.bloqueo ? ` — ${ev.bloqueo}` : ''}`,
                        ],
                    ].map(([etiqueta, valor]) => [
                        { text: etiqueta, style: 'etiqueta' },
                        { text: valor, color: COLOR_TEXTO },
                    ]),
                },
                layout: REJILLA,
            });
        }

        if (datos.porArea.length > 0) {
            cuerpo.push({ text: 'Resumen por área', style: 'seccion' });
            cuerpo.push({
                table: {
                    headerRows: 1,
                    widths: ['*', 55, 75, 75, 70],
                    body: [
                        ['Área', 'Total', 'Completados', 'En proceso', 'Pendientes'].map((t) => ({
                            text: t,
                            style: 'th',
                        })),
                        ...datos.porArea.map((a) => [
                            { text: a.area, color: COLOR_TEXTO },
                            { text: String(a.total), alignment: 'right', color: COLOR_TEXTO },
                            { text: String(a.completados), alignment: 'right', color: COLOR_TEXTO },
                            { text: String(a.enProceso), alignment: 'right', color: COLOR_TEXTO },
                            { text: String(a.pendientes), alignment: 'right', color: COLOR_TEXTO },
                        ]),
                    ],
                },
                layout: 'lightLines',
            });
        }

        if (datos.historial.length > 0) {
            cuerpo.push({ text: 'Historial de progresión', style: 'seccion' });
            cuerpo.push({
                table: {
                    headerRows: 1,
                    widths: ['*', 90, 100],
                    body: [
                        ['Adelanto', 'Estado', 'Culminación'].map((t) => ({ text: t, style: 'th' })),
                        ...datos.historial.map((h) => [
                            { text: h.nombre, color: COLOR_TEXTO },
                            {
                                text: ESTADO_PROGRESION_LABEL[h.estado] ?? h.estado,
                                color: COLOR_TEXTO,
                            },
                            { text: this.fecha(h.fechaCulminacion), color: COLOR_TEXTO },
                        ]),
                    ],
                },
                layout: 'lightLines',
            });
        }

        return {
            pageSize: 'A4',
            pageMargins: [54, 56, 54, 56],
            defaultStyle: { font: 'Roboto', fontSize: 10, color: COLOR_TEXTO },
            content: cuerpo,
            styles: {
                emisor: { fontSize: 8, bold: true, color: COLOR_SUAVE, characterSpacing: 1.5 },
                titulo: { fontSize: 19, bold: true, color: COLOR_TITULO, margin: [0, 4, 0, 0] },
                seccion: { fontSize: 11.5, bold: true, color: COLOR_TITULO, margin: [0, 14, 0, 5] },
                etiqueta: { bold: true, color: COLOR_SUAVE },
                th: { bold: true, color: COLOR_TITULO, fillColor: '#eef4fa' },
            },
            footer: (pagina: number, paginas: number) => ({
                text: `Generado el ${this.fecha(datos.generadoEn)} · Página ${pagina} de ${paginas}`,
                alignment: 'center',
                fontSize: 7.5,
                color: '#9ca3af',
                margin: [0, 10, 0, 0],
            }),
        };
    }

    // ── Carnet (tarjeta 85,6 × 54 mm) ───────────────────────────────────

    private docCarnet(d: CarnetDatos): TDocumentDefinitions {
        const filas: any[][] = [
            ['Unidad', d.unidad || '—'],
            ['Patrulla', d.patrulla ?? '—'],
            ['Ingreso', this.fecha(d.fechaIngreso)],
            ['Cargo', d.cargo ?? '—'],
        ].map(([etiqueta, valor]) => [
            { text: etiqueta, style: 'etiqueta' },
            { text: valor, color: COLOR_TEXTO },
        ]);

        return {
            pageSize: { width: 242.65, height: 153.07 },
            pageMargins: [12, 10, 12, 10],
            defaultStyle: { font: 'Roboto', fontSize: 8, color: COLOR_TEXTO },
            content: [
                {
                    columns: [
                        { text: 'CARNET SCOUT', style: 'carnetTitulo', width: '*' },
                        { text: d.grupo ?? '', style: 'carnetGrupo', width: 'auto' },
                    ],
                    margin: [0, 0, 0, 4],
                },
                {
                    canvas: [
                        { type: 'line', x1: 0, y1: 0, x2: 218, y2: 0, lineWidth: 1.5, lineColor: COLOR_TITULO },
                    ],
                    margin: [0, 0, 0, 6],
                },
                { text: `${d.apellidos}, ${d.nombres}`, style: 'carnetNombre', margin: [0, 0, 0, 8] },
                { table: { widths: [58, '*'], body: filas }, layout: 'noBorders' },
                {
                    text: `Nacimiento ${this.fecha(d.fechaNacimiento)} · ID ${d.miembroId.slice(0, 8).toUpperCase()}`,
                    style: 'carnetPie',
                    margin: [0, 8, 0, 0],
                },
            ],
            styles: {
                etiqueta: { bold: true, color: COLOR_SUAVE },
                carnetTitulo: { fontSize: 9, bold: true, color: COLOR_TITULO, characterSpacing: 1 },
                carnetGrupo: { fontSize: 6.5, color: COLOR_SUAVE, alignment: 'right' },
                carnetNombre: { fontSize: 13, bold: true, color: '#111827' },
                carnetPie: { fontSize: 6.5, color: COLOR_SUAVE },
            },
        };
    }

    // ── Listado de asistencia (A4) ───────────────────────────────────────

    private docAsistencia(p: PlanillaAsistenciaPdf): TDocumentDefinitions {
        const conteo: Record<string, number> = {
            PRESENTE: 0,
            AUSENTE: 0,
            JUSTIFICADO: 0,
            SIN_MARCA: 0,
        };
        for (const r of p.registros) {
            if (r.estado && r.estado in ESTADO_ASISTENCIA_LABEL) conteo[r.estado] += 1;
            else conteo.SIN_MARCA += 1;
        }

        const cuerpo: any[] = [
            { text: 'SISTEMA DE GESTIÓN SCOUT', style: 'emisor' },
            { text: 'Listado de asistencia', style: 'titulo' },
            {
                text: [
                    `${p.actividad.titulo} · `,
                    `${TIPO_ACTIVIDAD_LABEL[p.actividad.tipo] ?? p.actividad.tipo} · `,
                    this.fecha(p.actividad.fecha),
                ].join(''),
                style: 'nota',
            },
            {
                text: [
                    `Presentes ${conteo.PRESENTE}`,
                    `Ausentes ${conteo.AUSENTE}`,
                    `Justificados ${conteo.JUSTIFICADO}`,
                    `Sin marca ${conteo.SIN_MARCA}`,
                ].join(' · '),
                style: 'resumen',
            },
        ];

        if (p.registros.length === 0) {
            cuerpo.push({
                text: 'No hay jóvenes activos en el ámbito de esta actividad.',
                style: 'nota',
                margin: [0, 12, 0, 0],
            });
        } else {
            cuerpo.push({
                table: {
                    headerRows: 1,
                    widths: [26, '*', 78, 110],
                    body: [
                        ['N°', 'Miembro', 'Estado', 'Observación'].map((t) => ({ text: t, style: 'th' })),
                        ...p.registros.map((r, i) => [
                            { text: String(i + 1), alignment: 'right', color: COLOR_SUAVE },
                            { text: `${r.apellidos}, ${r.nombres}`, color: COLOR_TEXTO },
                            {
                                text: r.estado ? (ESTADO_ASISTENCIA_LABEL[r.estado] ?? r.estado) : 'Sin marca',
                                color: COLOR_TEXTO,
                                bold: r.estado === 'PRESENTE',
                            },
                            { text: r.observacion ?? '', color: COLOR_SUAVE },
                        ]),
                    ],
                },
                layout: 'lightLines',
                margin: [0, 4, 0, 0],
            });
        }

        return {
            pageSize: 'A4',
            pageMargins: [46, 56, 46, 56],
            defaultStyle: { font: 'Roboto', fontSize: 9, color: COLOR_TEXTO },
            content: cuerpo,
            styles: {
                emisor: { fontSize: 8, bold: true, color: COLOR_SUAVE, characterSpacing: 1.5 },
                titulo: { fontSize: 19, bold: true, color: COLOR_TITULO, margin: [0, 4, 0, 0] },
                nota: { fontSize: 9, color: COLOR_SUAVE },
                resumen: { fontSize: 9.5, bold: true, color: COLOR_TITULO, margin: [0, 10, 0, 4] },
                th: { bold: true, color: COLOR_TITULO, fillColor: '#eef4fa' },
            },
        };
    }

    // ── Utilidades ───────────────────────────────────────────────────────

    /** Fecha legible en es-VE; `timeZone: UTC` evita corrimiento por huso. */
    private fecha(valor: Date | string | null | undefined): string {
        if (!valor) return '—';
        const d = typeof valor === 'string' ? new Date(valor) : valor;
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('es-VE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
        });
    }
}
