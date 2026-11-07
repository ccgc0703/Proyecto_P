import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UnitPolicy } from '../../common/policies/unit.policy';

/** Actor mínimo necesario (solo lectura: el alcance se resuelve con UnitPolicy). */
export type Actor = {
    id?: string;
    roles?: string[];
    unidadId?: string | null;
    nodoId?: string | null;
};

export interface AlertaDashboard {
    tipo: 'SOLICITUD_PENDIENTE' | 'INDICADOR_PENDIENTE' | 'SEGURO_POR_VENCER';
    texto: string;
    link: string;
}

const DIA_MS = 24 * 60 * 60 * 1000;
/** Ventana de la tendencia semanal: 8 semanas. */
const VENTANA_TENDENCIA_DIAS = 56;
/** Ventana del promedio de asistencia. */
const VENTANA_PROMEDIO_DIAS = 30;
/** Horizonte de la alerta de seguro. */
const HORIZONTE_SEGURO_DIAS = 30;

/**
 * DashboardService — agregado ejecutivo de una sola llamada (Fase 2 del plan
 * de expansión).
 *
 * Toda la data se calcula en tiempo real (sin tablas de agregados) y se
 * limita al ámbito del usuario mediante `UnitPolicy.unidadesAlcance`:
 * - null  → visión global.
 * - array → solo esas unidades.
 *
 * Fuentes: Miembro (población), EstadoLogroJoven/Progresion (progresión),
 * Asistencia/Actividad (asistencia), FichaMedica (alertas de seguro).
 */
@Injectable()
export class DashboardService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly unitPolicy: UnitPolicy,
    ) { }

    // ── Alcance por unidad (ABAC) ─────────────────────────────────────

    /** Filtro base de jóvenes vivos, acotado al alcance del actor. */
    private whereJoven(alcance: string[] | null): any {
        const where: any = { tipo: 'JOVEN', deletedAt: null };
        if (alcance !== null) where.unidadId = { in: alcance };
        return where;
    }

    /** Unidades visibles (con nombre) para los desgloses porUnidad. */
    private async getUnidades(alcance: string[] | null) {
        return this.prisma.unidad.findMany({
            where: {
                deletedAt: null,
                ...(alcance !== null ? { id: { in: alcance } } : {}),
            },
            orderBy: { nombre: 'asc' },
            select: { id: true, nombre: true },
        });
    }

    // ── Resumen ───────────────────────────────────────────────────────

    async getResumen(user: Actor) {
        const alcance = await this.unitPolicy.unidadesAlcance(user);
        const whereJoven = this.whereJoven(alcance);

        const ahora = Date.now();
        const desde30 = new Date(ahora - VENTANA_PROMEDIO_DIAS * DIA_MS);
        const desde56 = new Date(ahora - VENTANA_TENDENCIA_DIAS * DIA_MS);
        const en30d = new Date(ahora + HORIZONTE_SEGURO_DIAS * DIA_MS);
        const inicioMes = new Date(ahora);
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);

        const unidades = await this.getUnidades(alcance);

        const [poblacion, progresion, asistencia, alertas] = await Promise.all([
            this.getPoblacion(whereJoven, unidades, desde30),
            this.getProgresion(whereJoven, unidades, inicioMes),
            this.getAsistencia(whereJoven, unidades, desde30, desde56, ahora, alcance),
            this.getAlertas(whereJoven, en30d),
        ]);

        return { poblacion, progresion, asistencia, alertas };
    }

    // ── Población ─────────────────────────────────────────────────────

    private async getPoblacion(
        whereJoven: any,
        unidades: Array<{ id: string; nombre: string }>,
        desde30: Date,
    ) {
        const [total, altas30d, bajas30d, agrupadas] = await Promise.all([
            this.prisma.miembro.count({ where: whereJoven }),
            this.prisma.miembro.count({ where: { ...whereJoven, createdAt: { gte: desde30 } } }),
            this.prisma.miembro.count({ where: { ...whereJoven, deletedAt: { gte: desde30 } } }),
            this.prisma.miembro.groupBy({
                by: ['unidadId'],
                where: whereJoven,
                _count: true,
            }),
        ]);

        const conteoPorUnidad = new Map<number | string, number>(
            agrupadas.map((g: any) => [g.unidadId, g._count as number]),
        );

        return {
            total,
            varMensual: altas30d - bajas30d,
            porUnidad: unidades.map((u) => ({
                unidadId: u.id,
                nombre: u.nombre,
                total: conteoPorUnidad.get(u.id) ?? 0,
            })),
        };
    }

    // ── Progresión ────────────────────────────────────────────────────

    private async getProgresion(
        whereJoven: any,
        unidades: Array<{ id: string; nombre: string }>,
        inicioMes: Date,
    ) {
        const whereLogro = { deletedAt: null, Joven: { Miembro: whereJoven } };

        // Una sola lectura da total, completados, pendientes de aprobación y
        // el desglose por unidad (bucket en memoria; el catálogo es nacional).
        const [estados, solicitudesPendientes, adelantosAprobadosMes] = await Promise.all([
            this.prisma.estadoLogroJoven.findMany({
                where: whereLogro,
                select: {
                    estado: true,
                    Joven: { select: { Miembro: { select: { unidadId: true } } } },
                },
            }),
            this.prisma.progresion.count({
                where: { deletedAt: null, estado: 'SOLICITADA', Joven: { Miembro: whereJoven } },
            }),
            this.prisma.progresion.count({
                where: {
                    deletedAt: null,
                    estado: 'APROBADA',
                    aprobadoEn: { gte: inicioMes },
                    Joven: { Miembro: whereJoven },
                },
            }),
        ]);

        const total = estados.length;
        const completados = estados.filter((e: any) => e.estado === 'COMPLETADO').length;
        const promedioPorcentaje = total
            ? Math.round((completados / total) * 1000) / 10
            : 0;

        const porUnidad = unidades.map((u) => {
            const delUnidad = estados.filter(
                (e: any) => e.Joven?.Miembro?.unidadId === u.id,
            );
            const ok = delUnidad.filter((e: any) => e.estado === 'COMPLETADO').length;
            return {
                unidadId: u.id,
                nombre: u.nombre,
                porcentaje: delUnidad.length
                    ? Math.round((ok / delUnidad.length) * 100)
                    : 0,
            };
        });

        return {
            promedioPorcentaje,
            adelantosAprobadosMes,
            solicitudesPendientes,
            porUnidad,
        };
    }

    // ── Asistencia ────────────────────────────────────────────────────

    private async getAsistencia(
        whereJoven: any,
        unidades: Array<{ id: string; nombre: string }>,
        desde30: Date,
        desde56: Date,
        ahora: number,
        alcance: string[] | null,
    ) {
        // Últimas 8 semanas en una sola lectura: alimenta promedio30d,
        // la tendencia semanal y el desglose por unidad.
        const registros = await this.prisma.asistencia.findMany({
            where: {
                deletedAt: null,
                createdAt: { gte: desde56 },
                Miembro: whereJoven,
            },
            select: {
                estado: true,
                createdAt: true,
                Miembro: { select: { unidadId: true } },
            },
        });

        const desde30ms = desde30.getTime();
        const regs30 = registros.filter(
            (r: any) => new Date(r.createdAt).getTime() >= desde30ms,
        );

        const pct = (presentes: number, total: number) =>
            total ? Math.round((presentes / total) * 100) : 0;

        const promedio30d = pct(
            regs30.filter((r: any) => r.estado === 'PRESENTE').length,
            regs30.length,
        );

        // Tendencia: 8 ventanas de 7 días, de la más antigua a la más reciente.
        const tendenciaSemanal: Array<{ semana: string; porcentaje: number }> = [];
        for (let i = VENTANA_TENDENCIA_DIAS / 7 - 1; i >= 0; i--) {
            const fin = ahora - i * 7 * DIA_MS;
            const inicio = fin - 7 * DIA_MS;
            const deLaSemana = registros.filter((r: any) => {
                const t = new Date(r.createdAt).getTime();
                return t >= inicio && t < fin;
            });
            tendenciaSemanal.push({
                semana: new Date(inicio).toISOString().slice(0, 10),
                porcentaje: pct(
                    deLaSemana.filter((r: any) => r.estado === 'PRESENTE').length,
                    deLaSemana.length,
                ),
            });
        }

        const ultimaActividad = await this.prisma.actividad.findFirst({
            where: {
                deletedAt: null,
                fecha: { lte: new Date(ahora) },
                Planificacion: {
                    deletedAt: null,
                    ...(alcance !== null
                        ? { OR: [{ unidadId: { in: alcance } }, { unidadId: null }] }
                        : {}),
                },
            },
            orderBy: { fecha: 'desc' },
            select: { id: true, titulo: true, fecha: true, tipo: true },
        });

        return {
            ultimaActividad,
            promedio30d,
            tendenciaSemanal,
            porUnidad: unidades.map((u) => {
                const delUnidad = regs30.filter(
                    (r: any) => r.Miembro?.unidadId === u.id,
                );
                return {
                    unidadId: u.id,
                    nombre: u.nombre,
                    porcentaje: pct(
                        delUnidad.filter((r: any) => r.estado === 'PRESENTE').length,
                        delUnidad.length,
                    ),
                };
            }),
        };
    }

    // ── Alertas (calculadas en tiempo real, sin persistir) ────────────

    private async getAlertas(whereJoven: any, en30d: Date): Promise<AlertaDashboard[]> {
        const whereLogro = { deletedAt: null, Joven: { Miembro: whereJoven } };

        const [indicadoresPendientes, segurosPorVencer, solicitudesPendientes] =
            await Promise.all([
                this.prisma.estadoLogroJoven.count({
                    where: { ...whereLogro, estado: 'PENDIENTE_APROBACION' },
                }),
                this.prisma.fichaMedica.count({
                    where: {
                        deletedAt: null,
                        seguroVigencia: { lte: en30d },
                        Miembro: whereJoven,
                    },
                }),
                this.prisma.progresion.count({
                    where: { deletedAt: null, estado: 'SOLICITADA', Joven: { Miembro: whereJoven } },
                }),
            ]);

        const alertas: AlertaDashboard[] = [];

        if (solicitudesPendientes > 0) {
            alertas.push({
                tipo: 'SOLICITUD_PENDIENTE',
                texto: `${solicitudesPendientes} solicitud(es) de adelanto esperando aprobación`,
                link: '/app/progresion',
            });
        }
        if (indicadoresPendientes > 0) {
            alertas.push({
                tipo: 'INDICADOR_PENDIENTE',
                texto: `${indicadoresPendientes} indicador(es) en estado "pendiente de aprobación"`,
                link: '/app/progresion',
            });
        }
        if (segurosPorVencer > 0) {
            alertas.push({
                tipo: 'SEGURO_POR_VENCER',
                texto: `${segurosPorVencer} ficha(s) médica(s) con seguro vencido o por vencer en ${HORIZONTE_SEGURO_DIAS} días`,
                link: '/app/miembros',
            });
        }

        return alertas;
    }
}
