import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RamaUnidad } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UnitAccessPolicy, UNIT_BYPASS_ROLES } from '../../common/policies/unit-access.policy';
import { esRama } from '../../common/ramas';
import { OpcionesLista, hayPaginacion, rangoLista, filtroBusqueda } from '../../common/paginacion';
import { ActualizarEstadoIndicadorDto } from './dto/actualizar-estado-indicador.dto';
import { RechazarProgresionDto } from './dto/rechazar-progresion.dto';
import { JovenExport, UnidadExport, AreaResumenExport, EvaluacionExport, HistorialExport } from './export.service';
import { RBAC_ROLES } from '../../common/constantes';

export interface Actor {
    id: string;
    roles?: string[];
    permissions?: string[];
    miembroId?: string | null;  // Vínculo usuario → miembro (self-scope del rol JOVEN)
}

export interface Evaluacion {
    esPruebaAislada: boolean;
    poolTotal: number;
    requerido: number;
    completados: number;
    porcentajeActual: number;
    faltantes: number;
    apto: boolean;
    bloqueo: { motivo: string } | null;
    faltantesDetallados: { id: string; codigo: string; texto: string }[];
}

interface ContextoJoven {
    miembro: any;
    joven: any;
    unidadId: string;
    unidadNombre: string;
    unidadRama: RamaUnidad | null;
}

const AREA_CRECIMIENTO_INCLUDE = {
    Area: { select: { id: true, nombre: true, orden: true, tipo: true } },
};

@Injectable()
export class ProgresionService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
        private readonly unitAccess: UnitAccessPolicy,
    ) { }

    private registrar(actorId: string, action: string, targetId: string, description: string): void {
        void this.audit.logAction({
            actorId,
            action,
            module: 'progresion',
            targetId,
            description,
        });
    }

    // ── Resolución de identidad (§10.2: la API recibe miembroId) ─────────

    private async getJovenPorMiembro(miembroId: string): Promise<ContextoJoven> {
        const miembro = await this.prisma.miembro.findFirst({
            where: { id: miembroId, deletedAt: null },
            include: { Unidad: { select: { id: true, nombre: true, tipo: true } }, Joven: true },
        });

        if (!miembro) throw new NotFoundException(`Miembro con ID ${miembroId} no encontrado`);
        if (miembro.tipo !== 'JOVEN') {
            throw new BadRequestException(`El miembro ${miembroId} no es un joven`);
        }
        if (!miembro.Joven) {
            throw new NotFoundException(`El miembro ${miembroId} no está registrado como joven scout`);
        }

        return {
            miembro,
            joven: miembro.Joven,
            unidadId: miembro.unidadId,
            unidadNombre: miembro.Unidad.nombre,
            unidadRama: esRama(miembro.Unidad.tipo) ? miembro.Unidad.tipo : null,
        };
    }

    private async assertAcceso(actor: Actor, unidadId: string): Promise<void> {
        await this.unitAccess.assertCanAccessUnit(actor.id, unidadId);
    }

    // ── Pool e items ──────────────────────────────────────────────────────

    private async getPool(rama: RamaUnidad | null) {
        if (!rama) return [];
        return this.prisma.indicadorLogro.findMany({
            where: {
                rama,
                deletedAt: null,
                activo: true,
                Area: { is: { tipo: 'AREA_CRECIMIENTO', deletedAt: null } },
            },
            include: AREA_CRECIMIENTO_INCLUDE,
            orderBy: [{ Area: { orden: 'asc' } }, { orden: 'asc' }],
        });
    }

    private async getItemsPrueba(rama: RamaUnidad | null) {
        if (!rama) return [];
        return this.prisma.indicadorLogro.findMany({
            where: {
                rama,
                deletedAt: null,
                activo: true,
                Area: { is: { tipo: 'PRUEBA_ADELANTO', deletedAt: null } },
            },
            include: AREA_CRECIMIENTO_INCLUDE,
            orderBy: { orden: 'asc' },
        });
    }

    private async getEstados(jovenId: string) {
        const filas = await this.prisma.estadoLogroJoven.findMany({
            where: { jovenId, deletedAt: null },
            select: {
                indicadorId: true,
                estado: true,
                observaciones: true,
                registradoPor: true,
                registradoEn: true,
                aprobadoPor: true,
                aprobadoEn: true,
            },
        });
        return new Map(filas.map((f) => [f.indicadorId, f]));
    }

    private async getProgresiones(jovenId: string) {
        return this.prisma.progresion.findMany({
            where: { jovenId, deletedAt: null },
            include: { Adelanto: true },
            orderBy: { fechaInicio: 'asc' },
        });
    }

    // ── Evaluación (§7.1) ────────────────────────────────────────────────

    private async evaluar(adelanto: any, jovenId: string): Promise<Evaluacion> {
        const [pool, items] = await Promise.all([
            this.getPool(adelanto.rama),
            this.getItemsPrueba(adelanto.rama),
        ]);
        const estados = await this.getEstados(jovenId);
        return this.evaluarConListas(adelanto, pool, items, estados);
    }

    private evaluarConListas(adelanto: any, pool: any[], items: any[], estados: Map<string, any>): Evaluacion {
        const completadosDe = (lista: any[]) =>
            lista.filter((i) => estados.get(i.id)?.estado === 'COMPLETADO');

        if (adelanto.umbralPorcentaje === null) {
            const completados = completadosDe(items).length;
            const poolTotal = items.length;
            const requerido = poolTotal;
            const faltantes = Math.max(requerido - completados, 0);

            return {
                esPruebaAislada: true,
                poolTotal,
                requerido,
                completados,
                porcentajeActual: poolTotal > 0 ? Math.floor((completados / poolTotal) * 1000) / 10 : 0,
                faltantes,
                apto: poolTotal > 0 && completados >= requerido,
                bloqueo: poolTotal === 0 ? { motivo: 'prueba aislada no definida' } : null,
                faltantesDetallados: this.textosFaltantes(items, estados),
            };
        }

        const poolTotal = pool.length;
        const requerido = Math.floor((poolTotal * adelanto.umbralPorcentaje) / 100);
        const completados = completadosDe(pool).length;
        const faltantes = Math.max(requerido - completados, 0);

        return {
            esPruebaAislada: false,
            poolTotal,
            requerido,
            completados,
            porcentajeActual: poolTotal > 0 ? Math.floor((completados / poolTotal) * 1000) / 10 : 0,
            faltantes,
            apto: completados >= requerido,
            bloqueo: null,
            faltantesDetallados: this.textosFaltantes(pool, estados),
        };
    }

    private textosFaltantes(lista: any[], estados: Map<string, any>): { id: string; codigo: string; texto: string }[] {
        return lista
            .filter((i) => estados.get(i.id)?.estado !== 'COMPLETADO')
            .map((i) => ({ id: i.id, codigo: i.codigo, texto: i.texto }));
    }

    // ── GET /progresion/jovenes/:miembroId/resumen ───────────────────────

    async getResumen(miembroId: string, actor: Actor) {
        const ctx = await this.getJovenPorMiembro(miembroId);
        await this.assertAcceso(actor, ctx.unidadId);

        const [pool, items, progresiones, areas] = await Promise.all([
            this.getPool(ctx.unidadRama),
            this.getItemsPrueba(ctx.unidadRama),
            this.getProgresiones(ctx.joven.id),
            this.prisma.areaCrecimiento.findMany({
                where: { tipo: 'AREA_CRECIMIENTO', deletedAt: null, OR: [{ rama: null }, { rama: ctx.unidadRama }] },
                orderBy: { orden: 'asc' },
            }),
        ]);
        const estados = await this.getEstados(ctx.joven.id);

        const adelantoActual = progresiones.find((p) => p.estado === 'EN_CURSO') ?? null;

        const porArea = areas.map((area) => {
            const delArea = pool.filter((i) => i.areaId === area.id);
            const conteo = { total: delArea.length, completados: 0, enProceso: 0, pendienteAprobacion: 0, pendientes: 0 };
            for (const ind of delArea) {
                const estado = estados.get(ind.id)?.estado ?? 'PENDIENTE';
                if (estado === 'COMPLETADO') conteo.completados++;
                else if (estado === 'EN_PROCESO') conteo.enProceso++;
                else if (estado === 'PENDIENTE_APROBACION') conteo.pendienteAprobacion++;
                else conteo.pendientes++;
            }
            return { area: area.nombre, ...conteo };
        });

        const evaluacion = adelantoActual ? await this.evaluar(adelantoActual.Adelanto, ctx.joven.id) : null;

        const historial = progresiones
            .filter((p) => p.id !== adelantoActual?.id)
            .map((p) => ({
                id: p.id,
                adelantoId: p.adelantoId,
                orden: p.Adelanto.orden,
                nombre: p.Adelanto.nombre,
                estado: p.estado,
                fechaInicio: p.fechaInicio,
                fechaCulminacion: p.fechaCulminacion,
                aprobadoPor: p.aprobadoPor,
                aprobadoEn: p.aprobadoEn,
            }));

        return {
            joven: {
                id: ctx.miembro.id,
                jovenId: ctx.joven.id,
                nombres: ctx.miembro.nombres,
                apellidos: ctx.miembro.apellidos,
                unidad: ctx.unidadNombre,
            },
            adelantoActual: adelantoActual
                ? {
                    id: adelantoActual.id,
                    adelantoId: adelantoActual.adelantoId,
                    orden: adelantoActual.Adelanto.orden,
                    nombre: adelantoActual.Adelanto.nombre,
                    umbralPorcentaje: adelantoActual.Adelanto.umbralPorcentaje,
                    poolTotal: evaluacion!.poolTotal,
                    requerido: evaluacion!.requerido,
                    completados: evaluacion!.completados,
                    porcentajeActual: evaluacion!.porcentajeActual,
                    esPruebaAislada: evaluacion!.esPruebaAislada,
                    faltantes: evaluacion!.faltantes,
                }
                : null,
            porArea,
            historialProgresiones: historial,
            puedeAprobar: this.puedeAprobar(actor, ctx.unidadNombre),
            bloqueo: evaluacion?.bloqueo ?? null,
        };
    }

    private puedeAprobar(actor: Actor, unidadNombre: string): boolean {
        const permisos = actor.permissions ?? [];
        if (!permisos.includes('progresion:aprobar')) return false;

        const roles = actor.roles ?? [];
        if (roles.some((r) => UNIT_BYPASS_ROLES.includes(r))) return true;

        const unidades = roles
            .filter((r) => r.startsWith('ADULTO_'))
            .map((r) => r.replace('ADULTO_', ''));
        const mapa: Record<string, string> = {
            MANADA: 'Manada',
            TROPA: 'Tropa',
            COMUNIDAD: 'Comunidad',
            CLAN: 'Clan',
        };
        return unidades.some((u) => mapa[u] === unidadNombre);
    }

    // ── GET /progresion/jovenes/:miembroId/indicadores ───────────────────

    async getIndicadores(miembroId: string, actor: Actor) {
        const ctx = await this.getJovenPorMiembro(miembroId);
        await this.assertAcceso(actor, ctx.unidadId);

        const [pool, items, estados] = await Promise.all([
            this.getPool(ctx.unidadRama),
            this.getItemsPrueba(ctx.unidadRama),
            this.getEstados(ctx.joven.id),
        ]);

        const progresiones = await this.getProgresiones(ctx.joven.id);
        const adelantoActual = progresiones.find((p) => p.estado === 'EN_CURSO') ?? null;

        const mapear = (i: any) => {
            const e = estados.get(i.id);
            return {
                id: i.id,
                codigo: i.codigo,
                texto: i.texto,
                orden: i.orden,
                areaId: i.areaId,
                area: i.Area.nombre,
                areaTipo: i.Area.tipo,
                etapaId: i.etapaId,
                estado: e?.estado ?? 'PENDIENTE',
                observaciones: e?.observaciones ?? null,
                registradoPor: e?.registradoPor ?? null,
                registradoEn: e?.registradoEn ?? null,
                aprobadoPor: e?.aprobadoPor ?? null,
                aprobadoEn: e?.aprobadoEn ?? null,
            };
        };

        return {
            joven: {
                id: ctx.miembro.id,
                jovenId: ctx.joven.id,
                nombres: ctx.miembro.nombres,
                apellidos: ctx.miembro.apellidos,
                unidad: ctx.unidadNombre,
            },
            adelantoActual: adelantoActual
                ? { id: adelantoActual.id, orden: adelantoActual.Adelanto.orden, nombre: adelantoActual.Adelanto.nombre }
                : null,
            indicadores: [...pool.map(mapear), ...items.map(mapear)],
        };
    }

    // ── PATCH /progresion/jovenes/:miembroId/indicadores/:indicadorId ────

    async actualizarEstado(miembroId: string, indicadorId: string, dto: ActualizarEstadoIndicadorDto, actor: Actor) {
        const ctx = await this.getJovenPorMiembro(miembroId);
        await this.assertAcceso(actor, ctx.unidadId);

        const indicador = await this.prisma.indicadorLogro.findFirst({
            where: { id: indicadorId, deletedAt: null },
            include: { Area: { select: { id: true, nombre: true, tipo: true } } },
        });
        if (!indicador) throw new NotFoundException(`Indicador con ID ${indicadorId} no encontrado`);
        if (indicador.rama !== ctx.unidadRama) {
            throw new BadRequestException('El indicador no pertenece a la unidad del joven');
        }

        const existente = await this.prisma.estadoLogroJoven.findFirst({
            where: { jovenId: ctx.joven.id, indicadorId, deletedAt: null },
        });

        const anterior = existente?.estado ?? 'PENDIENTE';
        const ahora = new Date();
        const aprobado = dto.estado === 'COMPLETADO';

        const data = {
            estado: dto.estado,
            observaciones: dto.observaciones !== undefined ? dto.observaciones : existente?.observaciones ?? null,
            registradoPor: actor.id,
            registradoEn: ahora,
            aprobadoPor: aprobado ? actor.id : null,
            aprobadoEn: aprobado ? ahora : null,
            updatedBy: actor.id,
        };

        const guardado = existente
            ? await this.prisma.estadoLogroJoven.update({ where: { id: existente.id }, data })
            : await this.prisma.estadoLogroJoven.create({
                data: { jovenId: ctx.joven.id, indicadorId, createdBy: actor.id, ...data },
            });

        if (anterior !== dto.estado) {
            this.registrar(
                actor.id,
                'INDICADOR_ESTADO_CHANGED',
                indicadorId,
                `Indicador ${indicador.codigo}: ${anterior} -> ${dto.estado}`,
            );
        }

        return guardado;
    }

    // ── POST /progresion/jovenes/:miembroId/adelantos/:adelantoId/iniciar ─

    async iniciarAdelanto(miembroId: string, adelantoId: string, actor: Actor) {
        const ctx = await this.getJovenPorMiembro(miembroId);
        await this.assertAcceso(actor, ctx.unidadId);

        const adelanto = await this.prisma.adelanto.findFirst({
            where: { id: adelantoId, deletedAt: null },
        });
        if (!adelanto) throw new NotFoundException(`Adelanto con ID ${adelantoId} no encontrado`);
        if (adelanto.rama !== ctx.unidadRama) {
            throw new BadRequestException('El adelanto no pertenece a la unidad del joven');
        }
        if (!adelanto.activo) throw new BadRequestException(`El adelanto "${adelanto.nombre}" está inactivo`);

        const existente = await this.prisma.progresion.findFirst({
            where: { jovenId: ctx.joven.id, adelantoId, deletedAt: null },
        });
        if (existente) {
            throw new ConflictException(`El adelanto "${adelanto.nombre}" ya fue iniciado por este joven`);
        }

        return this.prisma.progresion.create({
            data: {
                jovenId: ctx.joven.id,
                adelantoId,
                fechaInicio: new Date(),
                estado: 'EN_CURSO',
                createdBy: actor.id,
            },
            include: { Adelanto: true },
        });
    }

    // ── Progresiones ─────────────────────────────────────────────────────

    private async getProgresion(progresionId: string) {
        const progresion = await this.prisma.progresion.findFirst({
            where: { id: progresionId, deletedAt: null },
            include: {
                Adelanto: true,
                Joven: { include: { Miembro: { include: { Unidad: { select: { id: true, nombre: true } } } } } },
            },
        });
        if (!progresion) throw new NotFoundException(`Progresión con ID ${progresionId} no encontrada`);
        return progresion;
    }

    async solicitar(progresionId: string, actor: Actor) {
        const progresion = await this.getProgresion(progresionId);
        const unidadId = progresion.Joven.Miembro.unidadId;
        await this.assertAcceso(actor, unidadId);

        // Self-scope: el rol JOVEN solo puede solicitar sus propias progresiones
        if ((actor.roles ?? []).includes(RBAC_ROLES.JOVEN)) {
            const dueno = progresion.Joven.Miembro.id;
            if (!actor.miembroId || actor.miembroId !== dueno) {
                throw new ForbiddenException('Solo puedes solicitar tus propios adelantos');
            }
        }

        if (progresion.estado === 'SOLICITADA') {
            throw new ConflictException('La progresión ya está solicitada');
        }
        if (progresion.estado === 'APROBADA') {
            throw new ConflictException('La progresión ya fue aprobada');
        }

        const evaluacion = await this.evaluar(progresion.Adelanto, progresion.jovenId);

        if (!evaluacion.apto) {
            return {
                apto: false,
                requerido: evaluacion.requerido,
                completados: evaluacion.completados,
                faltantes: evaluacion.faltantes,
                bloqueo: evaluacion.bloqueo,
                faltantesDetallados: evaluacion.faltantesDetallados,
            };
        }

        await this.prisma.progresion.update({
            where: { id: progresion.id },
            data: { estado: 'SOLICITADA', updatedAt: new Date(), updatedBy: actor.id },
        });
        this.registrar(
            actor.id,
            'PROGRESION_SOLICITADA',
            progresion.id,
            `Adelanto "${progresion.Adelanto.nombre}" solicitado por ${progresion.Joven.Miembro.nombres} ${progresion.Joven.Miembro.apellidos}`,
        );

        return { apto: true, ...evaluacion };
    }

    async aprobar(progresionId: string, actor: Actor) {
        const progresion = await this.getProgresion(progresionId);
        const unidadId = progresion.Joven.Miembro.unidadId;
        await this.assertAcceso(actor, unidadId);

        if (progresion.estado !== 'SOLICITADA') {
            throw new ConflictException(`Solo se puede aprobar una progresión solicitada (estado actual: ${progresion.estado})`);
        }

        const evaluacion = await this.evaluar(progresion.Adelanto, progresion.jovenId);
        if (!evaluacion.apto) {
            throw new ConflictException(
                evaluacion.bloqueo
                    ? `No se puede aprobar: ${evaluacion.bloqueo.motivo}`
                    : `No se puede aprobar: faltan ${evaluacion.faltantes} indicador(es)`,
            );
        }

        const ahora = new Date();
        const actualizada = await this.prisma.progresion.update({
            where: { id: progresion.id },
            data: {
                estado: 'APROBADA',
                fechaCulminacion: ahora,
                aprobadoPor: actor.id,
                aprobadoEn: ahora,
                updatedAt: ahora,
                updatedBy: actor.id,
            },
            include: { Adelanto: true },
        });

        const siguiente = await this.prisma.adelanto.findFirst({
            where: {
                rama: progresion.Adelanto.rama,
                orden: progresion.Adelanto.orden + 1,
                activo: true,
                deletedAt: null,
            },
        });

        let progresionSiguiente: any = null;
        if (siguiente) {
            const yaExiste = await this.prisma.progresion.findFirst({
                where: { jovenId: progresion.jovenId, adelantoId: siguiente.id, deletedAt: null },
            });
            if (!yaExiste) {
                progresionSiguiente = await this.prisma.progresion.create({
                    data: {
                        jovenId: progresion.jovenId,
                        adelantoId: siguiente.id,
                        fechaInicio: ahora,
                        estado: 'EN_CURSO',
                        createdBy: actor.id,
                    },
                    include: { Adelanto: true },
                });
            }
        }

        this.registrar(
            actor.id,
            'PROGRESION_APROBADA',
            progresion.id,
            `Adelanto "${progresion.Adelanto.nombre}" aprobado${progresionSiguiente ? ` -> "${progresionSiguiente.Adelanto.nombre}" en curso` : ' (último adelanto de la unidad)'}`,
        );

        return { progresion: actualizada, siguiente: progresionSiguiente };
    }

    async rechazar(progresionId: string, dto: RechazarProgresionDto, actor: Actor) {
        const progresion = await this.getProgresion(progresionId);
        const unidadId = progresion.Joven.Miembro.unidadId;
        await this.assertAcceso(actor, unidadId);

        if (progresion.estado !== 'SOLICITADA') {
            throw new ConflictException(`Solo se puede rechazar una progresión solicitada (estado actual: ${progresion.estado})`);
        }

        const actualizada = await this.prisma.progresion.update({
            where: { id: progresion.id },
            data: { estado: 'RECHAZADA', updatedAt: new Date(), updatedBy: actor.id },
            include: { Adelanto: true },
        });

        this.registrar(
            actor.id,
            'PROGRESION_RECHAZADA',
            progresion.id,
            `Adelanto "${progresion.Adelanto.nombre}" rechazado${dto.motivo ? `: ${dto.motivo}` : ''}`,
        );

        return actualizada;
    }

    // ── GET /progresion/unidades/:unidadId/jovenes ───────────────────────

    async listarJovenesDeUnidad(unidadId: string, actor: Actor, opts?: OpcionesLista) {
        const unidad = await this.prisma.unidad.findFirst({
            where: { id: unidadId, deletedAt: null },
        });
        if (!unidad) throw new NotFoundException(`Unidad con ID ${unidadId} no encontrada`);

        await this.assertAcceso(actor, unidadId);

        const rama = esRama(unidad.tipo) ? unidad.tipo : null;

        const whereMiembro = {
            unidadId,
            tipo: 'JOVEN' as const,
            deletedAt: null,
            ...(filtroBusqueda(opts?.q, ['nombres', 'apellidos', 'cedula']) ?? {}),
        };

        const [miembros, pool, items] = await Promise.all([
            this.prisma.miembro.findMany({
                where: whereMiembro,
                include: {
                    Joven: {
                        include: {
                            Progresiones: {
                                where: { deletedAt: null },
                                include: { Adelanto: true },
                                orderBy: { fechaInicio: 'desc' },
                            },
                        },
                    },
                },
                orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
                ...(hayPaginacion(opts ?? {}) ? rangoLista(opts!) : {}),
            }),
            this.getPool(rama),
            this.getItemsPrueba(rama),
        ]);

        const jovenIds = miembros.filter((m) => m.Joven).map((m) => m.Joven.id);
        const completados = new Set(
            (
                await this.prisma.estadoLogroJoven.findMany({
                    where: { jovenId: { in: jovenIds }, deletedAt: null, estado: 'COMPLETADO' },
                    select: { jovenId: true, indicadorId: true },
                })
            ).map((e) => `${e.jovenId}|${e.indicadorId}`),
        );

        return miembros.map((m) => {
            const progresiones = m.Joven?.Progresiones ?? [];
            const actual = progresiones.find((p) => p.estado === 'EN_CURSO') ?? null;
            const itemsIds = (actual?.Adelanto.umbralPorcentaje === null ? items : pool).map((i) => i.id);
            const hechos = itemsIds.filter((id) => completados.has(`${m.Joven?.id}|${id}`)).length;
            const requerido = actual
                ? actual.Adelanto.umbralPorcentaje === null
                    ? itemsIds.length
                    : Math.floor((pool.length * actual.Adelanto.umbralPorcentaje) / 100)
                : 0;
            const porcentaje = itemsIds.length > 0 ? Math.floor((hechos / itemsIds.length) * 1000) / 10 : 0;

            return {
                miembroId: m.id,
                jovenId: m.Joven?.id ?? null,
                nombres: m.nombres,
                apellidos: m.apellidos,
                fechaNacimiento: m.fechaNacimiento,
                adelantoActual: actual
                    ? { id: actual.id, orden: actual.Adelanto.orden, nombre: actual.Adelanto.nombre, estado: actual.estado }
                    : null,
                poolTotal: itemsIds.length,
                requerido,
                completados: hechos,
                porcentajeActual: porcentaje,
                progresiones: progresiones.length,
            };
        });
    }

    /** Total de jóvenes activos de la unidad (para meta de paginación). */
    async countJovenesDeUnidad(unidadId: string, opts?: OpcionesLista) {
        return this.prisma.miembro.count({
            where: {
                unidadId,
                tipo: 'JOVEN',
                deletedAt: null,
                ...(filtroBusqueda(opts?.q, ['nombres', 'apellidos', 'cedula']) ?? {}),
            },
        });
    }

    // ── Export (§10.3) ───────────────────────────────────────────────────

    private async getCatalogoExport(rama: RamaUnidad | null) {
        const [pool, items, areas, etapas] = await Promise.all([
            this.getPool(rama),
            this.getItemsPrueba(rama),
            this.prisma.areaCrecimiento.findMany({
                where: { tipo: 'AREA_CRECIMIENTO', deletedAt: null, OR: [{ rama: null }, { rama }] },
                orderBy: { orden: 'asc' },
            }),
            this.prisma.etapa.findMany({
                where: { deletedAt: null, ...(rama ? { rama } : { id: { in: [] } }) },
                orderBy: { numero: 'asc' },
            }),
        ]);
        return { pool, items, areas, etapas };
    }

    private textoEtapas(etapas: { numero: number }[]): string {
        if (etapas.length === 0) return '—';
        const lista = etapas.map((e) => `${e.numero}ª`);
        return `${lista.join(', ')}${etapas.length === 1 ? ' etapa' : ' etapas'}`;
    }

    private armarJovenExport(
        miembro: any,
        unidadNombre: string,
        etapas: { numero: number }[],
        progresiones: any[],
        pool: any[],
        items: any[],
        areas: any[],
        estados: Map<string, any>,
    ): JovenExport {
        const actual = progresiones.find((p) => p.estado === 'EN_CURSO') ?? null;
        const evaluacion = actual ? this.evaluarConListas(actual.Adelanto, pool, items, estados) : null;

        const porArea: AreaResumenExport[] = areas.map((area) => {
            const delArea = pool.filter((i) => i.areaId === area.id);
            const conteo = { total: delArea.length, completados: 0, enProceso: 0, pendienteAprobacion: 0, pendientes: 0 };
            for (const ind of delArea) {
                const estado = estados.get(ind.id)?.estado ?? 'PENDIENTE';
                if (estado === 'COMPLETADO') conteo.completados++;
                else if (estado === 'EN_PROCESO') conteo.enProceso++;
                else if (estado === 'PENDIENTE_APROBACION') conteo.pendienteAprobacion++;
                else conteo.pendientes++;
            }
            return { area: area.nombre, ...conteo };
        });

        const indicadores = [...pool, ...items].map((i) => ({
            codigo: i.codigo,
            texto: i.texto,
            area: i.Area.nombre,
            areaTipo: i.Area.tipo,
            estado: estados.get(i.id)?.estado ?? 'PENDIENTE',
        }));

        const historial: HistorialExport[] = progresiones
            .filter((p) => p.id !== actual?.id)
            .map((p) => ({
                orden: p.Adelanto.orden,
                nombre: p.Adelanto.nombre,
                estado: p.estado,
                fechaInicio: p.fechaInicio,
                fechaCulminacion: p.fechaCulminacion,
                aprobadoPor: p.aprobadoPor,
            }));

        return {
            miembroId: miembro.id,
            nombres: miembro.nombres,
            apellidos: miembro.apellidos,
            fechaNacimiento: miembro.fechaNacimiento ?? null,
            unidad: unidadNombre,
            etapas: this.textoEtapas(etapas),
            adelantoActual: actual
                ? {
                    orden: actual.Adelanto.orden,
                    nombre: actual.Adelanto.nombre,
                    umbralPorcentaje: actual.Adelanto.umbralPorcentaje,
                }
                : null,
            evaluacion: evaluacion ? this.aEvaluacionExport(evaluacion) : null,
            porArea,
            indicadores,
            historial,
            generadoEn: new Date(),
        };
    }

    private aEvaluacionExport(ev: Evaluacion): EvaluacionExport {
        return {
            esPruebaAislada: ev.esPruebaAislada,
            poolTotal: ev.poolTotal,
            requerido: ev.requerido,
            completados: ev.completados,
            porcentajeActual: ev.porcentajeActual,
            faltantes: ev.faltantes,
            apto: ev.apto,
            bloqueo: ev.bloqueo?.motivo ?? null,
        };
    }

    async getDatosExportJoven(miembroId: string, actor: Actor): Promise<JovenExport> {
        const ctx = await this.getJovenPorMiembro(miembroId);
        await this.assertAcceso(actor, ctx.unidadId);

        const [progresiones, estados, catalogo] = await Promise.all([
            this.getProgresiones(ctx.joven.id),
            this.getEstados(ctx.joven.id),
            this.getCatalogoExport(ctx.unidadRama),
        ]);

        return this.armarJovenExport(
            ctx.miembro,
            ctx.unidadNombre,
            catalogo.etapas,
            progresiones,
            catalogo.pool,
            catalogo.items,
            catalogo.areas,
            estados,
        );
    }

    async getDatosExportUnidad(unidadId: string, actor: Actor): Promise<UnidadExport> {
        const unidad = await this.prisma.unidad.findFirst({
            where: { id: unidadId, deletedAt: null },
        });
        if (!unidad) throw new NotFoundException(`Unidad con ID ${unidadId} no encontrada`);

        await this.assertAcceso(actor, unidadId);

        const rama = esRama(unidad.tipo) ? unidad.tipo : null;

        const [miembros, adelantos, catalogo] = await Promise.all([
            this.prisma.miembro.findMany({
                where: { unidadId, tipo: 'JOVEN', deletedAt: null },
                include: {
                    Joven: {
                        include: {
                            Progresiones: {
                                where: { deletedAt: null },
                                include: { Adelanto: true },
                                orderBy: { fechaInicio: 'asc' },
                            },
                        },
                    },
                },
                orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
            }),
            this.prisma.adelanto.findMany({
                where: { deletedAt: null, activo: true, ...(rama ? { rama } : { id: { in: [] } }) },
                orderBy: { orden: 'asc' },
            }),
            this.getCatalogoExport(rama),
        ]);

        const jovenIds = miembros.filter((m) => m.Joven).map((m) => m.Joven.id);
        const estados = await this.prisma.estadoLogroJoven.findMany({
            where: { jovenId: { in: jovenIds }, deletedAt: null },
            select: {
                jovenId: true,
                indicadorId: true,
                estado: true,
                observaciones: true,
                registradoPor: true,
                registradoEn: true,
                aprobadoPor: true,
                aprobadoEn: true,
            },
        });

        const jovenes = miembros
            .filter((m) => m.Joven)
            .map((m) =>
                this.armarJovenExport(
                    m,
                    unidad.nombre,
                    catalogo.etapas,
                    m.Joven.Progresiones,
                    catalogo.pool,
                    catalogo.items,
                    catalogo.areas,
                    this.mapaEstados(estados, m.Joven.id),
                ),
            );

        return {
            unidad: {
                id: unidad.id,
                nombre: unidad.nombre,
                etapas: this.textoEtapas(catalogo.etapas),
                poolTotal: catalogo.pool.length,
            },
            adelantos: adelantos.map((a) => ({
                orden: a.orden,
                nombre: a.nombre,
                umbralPorcentaje: a.umbralPorcentaje,
                requerido:
                    a.umbralPorcentaje === null
                        ? 0
                        : Math.floor((catalogo.pool.length * a.umbralPorcentaje) / 100),
            })),
            jovenes,
        };
    }

    private mapaEstados(filas: any[], jovenId: string): Map<string, any> {
        return new Map(filas.filter((f) => f.jovenId === jovenId).map((f) => [f.indicadorId, f]));
    }
}
