import { Injectable } from '@nestjs/common';
import { Workbook, Worksheet } from 'exceljs';

export interface IndicadorExport {
    codigo: string;
    texto: string;
    area: string;
    areaTipo: string;
    estado: string;
}

export interface AreaResumenExport {
    area: string;
    total: number;
    completados: number;
    enProceso: number;
    pendienteAprobacion: number;
    pendientes: number;
}

export interface EvaluacionExport {
    esPruebaAislada: boolean;
    poolTotal: number;
    requerido: number;
    completados: number;
    porcentajeActual: number;
    faltantes: number;
    apto: boolean;
    bloqueo: string | null;
}

export interface HistorialExport {
    orden: number;
    nombre: string;
    estado: string;
    fechaInicio: Date | null;
    fechaCulminacion: Date | null;
    aprobadoPor: string | null;
}

export interface JovenExport {
    miembroId: string;
    nombres: string;
    apellidos: string;
    fechaNacimiento: Date | null;
    unidad: string;
    etapas: string;
    adelantoActual: { orden: number; nombre: string; umbralPorcentaje: number | null } | null;
    evaluacion: EvaluacionExport | null;
    porArea: AreaResumenExport[];
    indicadores: IndicadorExport[];
    historial: HistorialExport[];
    generadoEn: Date;
}

export interface UnidadExport {
    unidad: { id: string; nombre: string; etapas: string; poolTotal: number };
    adelantos: { orden: number; nombre: string; umbralPorcentaje: number | null; requerido: number }[];
    jovenes: JovenExport[];
}

const ESTADO_LABEL: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En proceso',
    PENDIENTE_APROBACION: 'Pendiente de aprobación',
    COMPLETADO: 'Completado',
};

const PROGRESION_LABEL: Record<string, string> = {
    EN_CURSO: 'En curso',
    SOLICITADA: 'Solicitada',
    APROBADA: 'Aprobada',
    RECHAZADA: 'Rechazada',
};

const COLOR_TITULO = 'FF1F4E79';
const COLOR_SECCION = 'FFDCE6F1';
const COLOR_CABECERA = 'FFB8CCE4';

const BORDE = { style: 'thin', color: { argb: 'FF9DB2C4' } } as const;

@Injectable()
export class ExportService {
    // ── Puntos de entrada ────────────────────────────────────────────────

    async renderJoven(datos: JovenExport): Promise<Buffer> {
        const wb = new Workbook();
        this.hojaResumen(wb.addWorksheet('Resumen'), datos);
        this.hojaIndicadores(wb.addWorksheet('Indicadores'), datos);
        return this.aBuffer(wb);
    }

    async renderUnidad(datos: UnidadExport): Promise<Buffer> {
        const wb = new Workbook();
        const usados = new Set<string>();
        this.hojaResumenUnidad(wb.addWorksheet(this.nombreUnico('Resumen', usados)), datos);

        for (const j of datos.jovenes) {
            const base = `${j.apellidos} ${j.nombres}`.trim();
            this.hojaResumen(wb.addWorksheet(this.nombreUnico(base, usados)), j);
            this.hojaIndicadores(wb.addWorksheet(this.nombreUnico(`${base} · Indicadores`, usados)), j);
        }

        return this.aBuffer(wb);
    }

    private async aBuffer(wb: Workbook): Promise<Buffer> {
        const data = await wb.xlsx.writeBuffer();
        return Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
    }

    // ── Hoja "Resumen" de un joven ───────────────────────────────────────

    private hojaResumen(ws: Worksheet, j: JovenExport): void {
        ws.columns = [
            { width: 26 }, { width: 14 }, { width: 16 }, { width: 16 }, { width: 22 }, { width: 16 },
        ];
        ws.views = [{ state: 'frozen', ySplit: 1 }];

        this.titulo(ws, `CUADRO DE ADELANTO — ${j.unidad.toUpperCase()}`, 6);
        let r = 3;
        r = this.par(ws, r, 'Unidad', j.unidad);
        r = this.par(ws, r, 'Etapas', j.etapas);
        r = this.par(ws, r, 'Joven', `${j.apellidos}, ${j.nombres}`);
        r = this.par(ws, r, 'F. nacimiento', this.fmtFecha(j.fechaNacimiento));
        r = this.par(ws, r, 'Generado', this.fmtFechaHora(j.generadoEn));
        r++;

        this.seccion(ws, r, 'ADELANTO ACTUAL', 6);
        r++;
        const ad = j.adelantoActual;
        const ev = j.evaluacion;
        if (!ad || !ev) {
            r = this.par(ws, r, 'Adelanto', 'Sin adelanto iniciado');
            r = this.par(ws, r, 'Progreso', '—');
        } else {
            r = this.par(ws, r, 'Adelanto', `N.º ${ad.orden} — ${ad.nombre}`);
            r = this.par(ws, r, 'Umbral', this.fmtUmbral(ad, ev));
            r = this.par(ws, r, 'Progreso', `${ev.completados} de ${ev.poolTotal} (${ev.porcentajeActual} %)`);
            r = this.par(ws, r, 'Faltantes', String(ev.faltantes));
            r = this.par(
                ws,
                r,
                'Estado',
                ev.apto
                    ? 'Apto para solicitar el ascenso'
                    : ev.bloqueo
                        ? `Bloqueado: ${ev.bloqueo}`
                        : `No apto: faltan ${ev.faltantes} indicador(es)`,
            );
        }
        r++;

        this.seccion(ws, r, 'RESUMEN POR ÁREA', 6);
        r++;
        this.cabecera(ws, r, ['Área', 'Total', 'Completados', 'En proceso', 'Pend. aprobación', 'Pendientes']);
        r++;
        const totales = { total: 0, completados: 0, enProceso: 0, pendienteAprobacion: 0, pendientes: 0 };
        for (const a of j.porArea) {
            this.filaTabla(ws, r, [
                a.area, a.total, a.completados, a.enProceso, a.pendienteAprobacion, a.pendientes,
            ]);
            totales.total += a.total;
            totales.completados += a.completados;
            totales.enProceso += a.enProceso;
            totales.pendienteAprobacion += a.pendienteAprobacion;
            totales.pendientes += a.pendientes;
            r++;
        }
        this.filaTabla(ws, r, [
            'TOTAL', totales.total, totales.completados, totales.enProceso,
            totales.pendienteAprobacion, totales.pendientes,
        ], true);
        r += 2;

        if (j.historial.length > 0) {
            this.seccion(ws, r, 'HISTORIAL DE ADELANTOS', 6);
            r++;
            this.cabecera(ws, r, ['Adelanto', 'Inicio', 'Culminación', 'Aprobado por', 'Estado']);
            r++;
            for (const h of j.historial) {
                this.filaTabla(ws, r, [
                    `N.º ${h.orden} — ${h.nombre}`,
                    this.fmtFecha(h.fechaInicio),
                    this.fmtFecha(h.fechaCulminacion),
                    h.aprobadoPor ?? '—',
                    PROGRESION_LABEL[h.estado] ?? h.estado,
                ]);
                r++;
            }
        }
    }

    // ── Hoja "Indicadores" de un joven ───────────────────────────────────

    private hojaIndicadores(ws: Worksheet, j: JovenExport): void {
        ws.columns = [{ width: 16 }, { width: 90 }, { width: 28 }, { width: 8 }];
        ws.views = [{ state: 'frozen', ySplit: 2 }];

        this.titulo(ws, `INDICADORES — ${j.apellidos}, ${j.nombres} (${j.unidad})`, 4);

        let r = 3;
        const grupos = new Map<string, { area: string; orden: number; filas: IndicadorExport[] }>();
        j.indicadores.forEach((ind, i) => {
            const g = grupos.get(ind.area) ?? { area: ind.area, orden: i, filas: [] };
            g.filas.push(ind);
            grupos.set(ind.area, g);
        });

        for (const g of grupos.values()) {
            this.seccion(ws, r, g.area.toUpperCase(), 4);
            r++;
            this.cabecera(ws, r, ['Código', 'Indicador', 'Estado', '✓']);
            r++;
            for (const ind of g.filas) {
                this.filaTabla(ws, r, [
                    ind.codigo,
                    ind.texto,
                    ESTADO_LABEL[ind.estado] ?? ind.estado,
                    ind.estado === 'COMPLETADO' ? '✓' : '',
                ]);
                r++;
            }
            r++;
        }
    }

    // ── Hoja "Resumen" de una unidad ─────────────────────────────────────

    private hojaResumenUnidad(ws: Worksheet, u: UnidadExport): void {
        ws.columns = [
            { width: 26 }, { width: 20 }, { width: 16 }, { width: 26 },
            { width: 14 }, { width: 14 }, { width: 10 }, { width: 20 },
        ];

        this.titulo(ws, `CUADRO DE ADELANTO — ${u.unidad.nombre.toUpperCase()}`, 8);
        let r = 3;
        r = this.par(ws, r, 'Unidad', u.unidad.nombre);
        r = this.par(ws, r, 'Etapas', u.unidad.etapas);
        r = this.par(ws, r, 'Pool de indicadores', String(u.unidad.poolTotal));
        r = this.par(ws, r, 'Jóvenes', String(u.jovenes.length));
        r++;

        this.seccion(ws, r, 'ADELANTOS DE LA UNIDAD', 8);
        r++;
        this.cabecera(ws, r, ['Adelanto', 'N.º', 'Umbral', 'Requerido']);
        r++;
        for (const a of u.adelantos) {
            this.filaTabla(ws, r, [
                a.nombre,
                a.orden,
                a.umbralPorcentaje === null ? 'Prueba aislada' : `${a.umbralPorcentaje} %`,
                a.umbralPorcentaje === null ? 'Todos los ítems' : `${a.requerido} de ${u.unidad.poolTotal}`,
            ]);
            r++;
        }
        r++;

        this.seccion(ws, r, 'JÓVENES DE LA UNIDAD', 8);
        r++;
        this.cabecera(ws, r, [
            'Apellidos', 'Nombres', 'F. nacimiento', 'Adelanto actual',
            'Completados', 'Requerido', '%', 'Estado progresión',
        ]);
        r++;
        for (const j of u.jovenes) {
            const ev = j.evaluacion;
            this.filaTabla(ws, r, [
                j.apellidos,
                j.nombres,
                this.fmtFecha(j.fechaNacimiento),
                j.adelantoActual ? j.adelantoActual.nombre : '—',
                ev ? ev.completados : 0,
                ev ? ev.requerido : 0,
                ev ? ev.porcentajeActual : 0,
                j.adelantoActual ? 'En curso' : 'Sin iniciar',
            ]);
            r++;
        }
    }

    // ── Helpers de formato ───────────────────────────────────────────────

    private titulo(ws: Worksheet, texto: string, columnas: number): void {
        ws.mergeCells(1, 1, 1, columnas);
        const c = ws.getCell(1, 1);
        c.value = texto;
        c.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        c.alignment = { horizontal: 'center', vertical: 'middle' };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TITULO } };
        ws.getRow(1).height = 28;
    }

    private seccion(ws: Worksheet, fila: number, texto: string, columnas: number): void {
        ws.mergeCells(fila, 1, fila, columnas);
        const c = ws.getCell(fila, 1);
        c.value = texto;
        c.font = { bold: true, size: 11 };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SECCION } };
        c.alignment = { vertical: 'middle' };
        ws.getRow(fila).height = 20;
    }

    private par(ws: Worksheet, fila: number, etiqueta: string, valor: string): number {
        const a = ws.getCell(fila, 1);
        a.value = etiqueta;
        a.font = { bold: true };
        ws.getCell(fila, 2).value = valor;
        return fila + 1;
    }

    private cabecera(ws: Worksheet, fila: number, valores: string[]): void {
        valores.forEach((v, i) => {
            const c = ws.getCell(fila, i + 1);
            c.value = v;
            c.font = { bold: true };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_CABECERA } };
            c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            c.border = this.borde();
        });
        ws.getRow(fila).height = 30;
    }

    private filaTabla(ws: Worksheet, fila: number, valores: (string | number)[], total = false): void {
        valores.forEach((v, i) => {
            const c = ws.getCell(fila, i + 1);
            c.value = v;
            if (total) c.font = { bold: true };
            if (typeof v === 'number') c.alignment = { horizontal: 'center' };
            c.border = this.borde();
        });
    }

    private borde() {
        return { top: { ...BORDE }, left: { ...BORDE }, bottom: { ...BORDE }, right: { ...BORDE } };
    }

    private nombreUnico(base: string, usados: Set<string>): string {
        const limpio = base.replace(/[[\]:*?\/\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 31) || 'Hoja';
        let nombre = limpio;
        let n = 2;
        while (usados.has(nombre)) {
            const sufijo = ` (${n})`;
            nombre = limpio.slice(0, 31 - sufijo.length) + sufijo;
            n++;
        }
        usados.add(nombre);
        return nombre;
    }

    private fmtFecha(d: Date | string | null | undefined): string {
        if (!d) return '—';
        const fecha = new Date(d);
        return isNaN(fecha.getTime()) ? '—' : fecha.toLocaleDateString('es-VE');
    }

    private fmtFechaHora(d: Date | string | null | undefined): string {
        if (!d) return '—';
        const fecha = new Date(d);
        return isNaN(fecha.getTime()) ? '—' : fecha.toLocaleString('es-VE');
    }

    private fmtUmbral(ad: { umbralPorcentaje: number | null }, ev: EvaluacionExport): string {
        if (ad.umbralPorcentaje === null) {
            return `Prueba aislada (${ev.poolTotal} ítems)`;
        }
        return `${ad.umbralPorcentaje} % → ${ev.requerido} de ${ev.poolTotal}`;
    }
}
