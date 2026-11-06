import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UnitPolicy } from '../../common/policies/unit.policy';
import { OpcionesLista, filtroBusqueda, rangoLista } from '../../common/paginacion';
import { CreatePlanificacionDto } from './dto/create-planificacion.dto';
import { UpdatePlanificacionDto } from './dto/update-planificacion.dto';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { AsistenciaBulkDto } from './dto/asistencia-bulk.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import {
    QueryActividadesDto,
    QueryAsistenciasUnidadDto,
    QueryPlanificacionesDto,
} from './dto/query-eventos.dto';

/** Usuario enriquecido por JwtStrategy (req.user). */
export interface Actor {
    id: string;
    roles: string[];
    unidadId?: string | null;
    nodoId?: string | null;
}

const ACTIVIDAD_INCLUDE = {
    Planificacion: {
        select: { id: true, titulo: true, unidadId: true, estado: true, fechaInicio: true, fechaFin: true },
    },
};

@Injectable()
export class EventosService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
        private readonly unitPolicy: UnitPolicy,
    ) { }

    private registrar(
        userId: string | undefined,
        action: string,
        targetId: string,
        description: string,
    ): void {
        void this.audit.logAction({
            actorId: userId,
            action,
            module: 'eventos',
            targetId,
            description,
        });
    }

    // ── Alcance por unidad (ABAC) ─────────────────────────────────────

    /**
     * Filtro de alcance para listados de planificaciones:
     * - alcance null → visión global (sin filtro).
     * - alcance array → esas unidades + ámbito grupo (unidadId null).
     */
    private andAlcancePlanificacion(alcance: string[] | null): any[] {
        if (alcance === null) return [];
        return [{ OR: [{ unidadId: { in: alcance } }, { unidadId: null }] }];
    }

    /** Mismo filtro aplicado a Actividad a través de su Planificacion. */
    private andAlcanceActividad(alcance: string[] | null): any[] {
        if (alcance === null) return [];
        return [{
            Planificacion: {
                deletedAt: null,
                OR: [{ unidadId: { in: alcance } }, { unidadId: null }],
            },
        }];
    }

    /**
     * Ámbito de miembros marcables en una actividad:
     * - planificación con unidad → solo esa unidad (el actor ya probó que puede gestionarla).
     * - planificación de grupo → unidades del alcance del actor (null = todas).
     */
    private unidadesMarcables(
        unidadPlanificacion: string | null,
        alcance: string[] | null,
    ): string[] | null {
        if (unidadPlanificacion) return [unidadPlanificacion];
        return alcance;
    }

    private whereMiembrosMarcables(unidades: string[] | null): any {
        const base: any = { tipo: 'JOVEN', estado: 'ACTIVO' };
        if (unidades === null) return base;
        return { ...base, unidadId: { in: unidades } };
    }

    // ── Planificaciones ───────────────────────────────────────────────

    private async wherePlanificaciones(
        query: QueryPlanificacionesDto,
        user: Actor,
        q?: string,
    ): Promise<any> {
        if (query.unidadId) {
            await this.unitPolicy.assertCanManageUnit(user, query.unidadId);
        }
        const alcance = await this.unitPolicy.unidadesAlcance(user);

        const and: any[] = this.andAlcancePlanificacion(alcance);
        const busqueda = filtroBusqueda(q, ['titulo', 'descripcion']);
        if (busqueda) and.push(busqueda);

        const where: any = { deletedAt: null };
        if (and.length) where.AND = and;
        if (query.unidadId) where.unidadId = query.unidadId;
        if (query.estado) where.estado = query.estado;
        return where;
    }

    async findPlanificaciones(query: QueryPlanificacionesDto, user: Actor, opts: OpcionesLista) {
        const where = await this.wherePlanificaciones(query, user, opts.q);
        const { skip, take } = rangoLista(opts);
        return this.prisma.planificacion.findMany({
            where,
            include: { _count: { select: { Actividades: { where: { deletedAt: null } } } } },
            orderBy: { fechaInicio: 'desc' },
            ...(opts.page !== undefined || opts.limit !== undefined ? { skip, take } : {}),
        });
    }

    async countPlanificaciones(query: QueryPlanificacionesDto, user: Actor, q?: string): Promise<number> {
        const where = await this.wherePlanificaciones(query, user, q);
        return this.prisma.planificacion.count({ where });
    }

    private async getPlanificacion(id: string, user: Actor) {
        const planificacion = await this.prisma.planificacion.findFirst({
            where: { id, deletedAt: null },
            include: { _count: { select: { Actividades: { where: { deletedAt: null } } } } },
        });
        if (!planificacion) {
            throw new NotFoundException(`La planificación con ID ${id} no existe`);
        }
        if (planificacion.unidadId) {
            await this.unitPolicy.assertCanManageUnit(user, planificacion.unidadId);
        }
        return planificacion;
    }

    async findOnePlanificacion(id: string, user: Actor) {
        return this.getPlanificacion(id, user);
    }

    async createPlanificacion(dto: CreatePlanificacionDto, user: Actor) {
        if (dto.unidadId) {
            await this.unitPolicy.assertCanManageUnit(user, dto.unidadId);
        }
        const planificacion = await this.prisma.planificacion.create({
            data: {
                titulo: dto.titulo,
                descripcion: dto.descripcion,
                fechaInicio: new Date(dto.fechaInicio),
                fechaFin: new Date(dto.fechaFin),
                unidadId: dto.unidadId,
                estado: dto.estado,
                createdBy: user.id,
            },
        });
        this.registrar(
            user.id,
            'PLANIFICACION_CREATED',
            planificacion.id,
            `Planificación "${planificacion.titulo}" creada`,
        );
        return planificacion;
    }

    async updatePlanificacion(id: string, dto: UpdatePlanificacionDto, user: Actor) {
        const actual = await this.getPlanificacion(id, user);
        const unidadEfectiva = dto.unidadId ?? actual.unidadId;
        if (unidadEfectiva) {
            await this.unitPolicy.assertCanManageUnit(user, unidadEfectiva);
        }
        const planificacion = await this.prisma.planificacion.update({
            where: { id },
            data: {
                ...dto,
                ...(dto.fechaInicio ? { fechaInicio: new Date(dto.fechaInicio) } : {}),
                ...(dto.fechaFin ? { fechaFin: new Date(dto.fechaFin) } : {}),
                updatedBy: user.id,
            },
        });
        this.registrar(
            user.id,
            'PLANIFICACION_UPDATED',
            id,
            `Planificación "${planificacion.titulo}" actualizada`,
        );
        return planificacion;
    }

    async removePlanificacion(id: string, user: Actor) {
        const planificacion = await this.getPlanificacion(id, user);

        const total = await this.prisma.actividad.count({
            where: { planificacionId: id, deletedAt: null },
        });
        if (total > 0) {
            throw new ConflictException(
                `No se puede eliminar la planificación "${planificacion.titulo}": tiene ${total} actividad(es) activa(s).`,
            );
        }

        await this.prisma.planificacion.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: user.id },
        });
        this.registrar(
            user.id,
            'PLANIFICACION_DELETED',
            id,
            `Planificación "${planificacion.titulo}" eliminada`,
        );
    }

    // ── Actividades ───────────────────────────────────────────────────

    private async whereActividades(
        query: QueryActividadesDto,
        user: Actor,
        q?: string,
    ): Promise<any> {
        if (query.unidadId) {
            await this.unitPolicy.assertCanManageUnit(user, query.unidadId);
        }
        const alcance = await this.unitPolicy.unidadesAlcance(user);

        const and: any[] = [
            { Planificacion: { deletedAt: null } },
            ...this.andAlcanceActividad(alcance),
        ];
        const busqueda = filtroBusqueda(q, ['titulo', 'descripcion', 'lugar']);
        if (busqueda) and.push(busqueda);

        const where: any = { deletedAt: null, AND: and };
        if (query.planificacionId) where.planificacionId = query.planificacionId;
        if (query.unidadId) {
            where.Planificacion = { deletedAt: null, unidadId: query.unidadId };
        }
        if (query.tipo) where.tipo = query.tipo;
        if (query.estado) where.estado = query.estado;
        if (query.desde || query.hasta) {
            where.fecha = {
                ...(query.desde ? { gte: new Date(query.desde) } : {}),
                ...(query.hasta ? { lte: new Date(query.hasta) } : {}),
            };
        }
        return where;
    }

    async findActividades(query: QueryActividadesDto, user: Actor, opts: OpcionesLista) {
        const where = await this.whereActividades(query, user, opts.q);
        const { skip, take } = rangoLista(opts);
        return this.prisma.actividad.findMany({
            where,
            include: ACTIVIDAD_INCLUDE,
            orderBy: [{ fecha: 'desc' }, { horaInicio: 'asc' }],
            ...(opts.page !== undefined || opts.limit !== undefined ? { skip, take } : {}),
        });
    }

    async countActividades(query: QueryActividadesDto, user: Actor, q?: string): Promise<number> {
        const where = await this.whereActividades(query, user, q);
        return this.prisma.actividad.count({ where });
    }

    private async getActividad(id: string, user: Actor) {
        const actividad = await this.prisma.actividad.findFirst({
            where: { id, deletedAt: null },
            include: ACTIVIDAD_INCLUDE,
        });
        if (!actividad) {
            throw new NotFoundException(`La actividad con ID ${id} no existe`);
        }
        if (actividad.Planificacion.unidadId) {
            await this.unitPolicy.assertCanManageUnit(user, actividad.Planificacion.unidadId);
        }
        return actividad;
    }

    async findOneActividad(id: string, user: Actor) {
        return this.getActividad(id, user);
    }

    async createActividad(planificacionId: string, dto: CreateActividadDto, user: Actor) {
        const planificacion = await this.getPlanificacion(planificacionId, user);

        const actividad = await this.prisma.actividad.create({
            data: {
                titulo: dto.titulo,
                descripcion: dto.descripcion,
                tipo: dto.tipo,
                fecha: new Date(dto.fecha),
                horaInicio: dto.horaInicio,
                horaFin: dto.horaFin,
                lugar: dto.lugar,
                responsable: dto.responsable,
                estado: dto.estado,
                planificacionId: planificacion.id,
                createdBy: user.id,
            },
            include: ACTIVIDAD_INCLUDE,
        });
        this.registrar(
            user.id,
            'ACTIVIDAD_CREATED',
            actividad.id,
            `Actividad "${actividad.titulo}" creada en "${planificacion.titulo}"`,
        );
        return actividad;
    }

    async updateActividad(id: string, dto: UpdateActividadDto, user: Actor) {
        await this.getActividad(id, user);
        const actividad = await this.prisma.actividad.update({
            where: { id },
            data: {
                ...dto,
                ...(dto.fecha ? { fecha: new Date(dto.fecha) } : {}),
            },
            include: ACTIVIDAD_INCLUDE,
        });
        this.registrar(
            user.id,
            'ACTIVIDAD_UPDATED',
            id,
            `Actividad "${actividad.titulo}" actualizada`,
        );
        return actividad;
    }

    async removeActividad(id: string, user: Actor) {
        const actividad = await this.getActividad(id, user);

        const total = await this.prisma.asistencia.count({
            where: { actividadId: id, deletedAt: null },
        });
        if (total > 0) {
            throw new ConflictException(
                `No se puede eliminar la actividad "${actividad.titulo}": tiene ${total} asistencia(s) registrada(s).`,
            );
        }

        await this.prisma.actividad.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        this.registrar(
            user.id,
            'ACTIVIDAD_DELETED',
            id,
            `Actividad "${actividad.titulo}" eliminada`,
        );
    }

    // ── Asistencias ───────────────────────────────────────────────────

    /**
     * Planilla de la actividad: jóvenes del ámbito + su marca (si existe).
     * Devuelve { actividad, registros } para pintar el dialogo de marcado.
     */
    async listarAsistenciasActividad(actividadId: string, user: Actor) {
        const actividad = await this.getActividad(actividadId, user);
        const alcance = await this.unitPolicy.unidadesAlcance(user);
        const unidades = this.unidadesMarcables(actividad.Planificacion.unidadId, alcance);

        const [miembros, marcas] = await Promise.all([
            this.prisma.miembro.findMany({
                where: this.whereMiembrosMarcables(unidades),
                select: { id: true, nombres: true, apellidos: true, unidadId: true },
                orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
            }),
            this.prisma.asistencia.findMany({
                where: { actividadId, deletedAt: null },
            }),
        ]);

        const porMiembro = new Map(marcas.map((m) => [m.miembroId, m]));
        const registros = miembros.map((miembro) => {
            const marca = porMiembro.get(miembro.id);
            return {
                miembroId: miembro.id,
                nombres: miembro.nombres,
                apellidos: miembro.apellidos,
                unidadId: miembro.unidadId,
                asistenciaId: marca?.id ?? null,
                estado: marca?.estado ?? null,
                observacion: marca?.observacion ?? null,
            };
        });

        return {
            actividad: {
                id: actividad.id,
                titulo: actividad.titulo,
                fecha: actividad.fecha,
                tipo: actividad.tipo,
                estado: actividad.estado,
                planificacionId: actividad.planificacionId,
                planificacion: actividad.Planificacion,
            },
            registros,
        };
    }

    /**
     * Marcado masivo: upsert por (actividadId, miembroId). Audita UN evento
     * ASISTENCIA_BULK con el conteo (no fila por fila, para no inundar el log).
     */
    async registrarAsistenciasBulk(actividadId: string, dto: AsistenciaBulkDto, user: Actor) {
        const actividad = await this.getActividad(actividadId, user);
        const alcance = await this.unitPolicy.unidadesAlcance(user);
        const unidades = this.unidadesMarcables(actividad.Planificacion.unidadId, alcance);

        const ids = [...new Set(dto.registros.map((r) => r.miembroId))];
        const validos = await this.prisma.miembro.findMany({
            where: { id: { in: ids }, ...this.whereMiembrosMarcables(unidades) },
            select: { id: true },
        });
        const validosSet = new Set(validos.map((m) => m.id));
        const invalidos = ids.filter((id) => !validosSet.has(id));
        if (invalidos.length > 0) {
            throw new ConflictException(
                `No se puede registrar asistencia: miembro(s) inexistente(s), inactivo(s) o fuera de tu unidad: ${invalidos.join(', ')}`,
            );
        }

        await Promise.all(
            dto.registros.map((r) =>
                this.prisma.asistencia.upsert({
                    where: { actividadId_miembroId: { actividadId, miembroId: r.miembroId } },
                    create: {
                        actividadId,
                        miembroId: r.miembroId,
                        estado: r.estado,
                        observacion: r.observacion,
                        createdBy: user.id,
                    },
                    update: {
                        estado: r.estado,
                        observacion: r.observacion,
                        deletedAt: null,
                        updatedBy: user.id,
                    },
                }),
            ),
        );

        this.registrar(
            user.id,
            'ASISTENCIA_BULK',
            actividadId,
            `Asistencia de "${actividad.titulo}": ${dto.registros.length} marca(s) registrada(s)`,
        );
        return { registrados: dto.registros.length };
    }

    async updateAsistencia(id: string, dto: UpdateAsistenciaDto, user: Actor) {
        const asistencia = await this.prisma.asistencia.findFirst({
            where: { id, deletedAt: null },
        });
        if (!asistencia) {
            throw new NotFoundException(`La asistencia con ID ${id} no existe`);
        }
        await this.getActividad(asistencia.actividadId, user);

        const actualizada = await this.prisma.asistencia.update({
            where: { id },
            data: { ...dto, updatedBy: user.id },
        });
        this.registrar(
            user.id,
            'ASISTENCIA_UPDATED',
            id,
            `Asistencia ${id} actualizada a ${actualizada.estado}`,
        );
        return actualizada;
    }

    /** Asistencias de una unidad en un rango de fechas (alimenta el Dashboard). */
    async asistenciasDeUnidad(
        unidadId: string,
        query: QueryAsistenciasUnidadDto,
        user: Actor,
    ) {
        await this.unitPolicy.assertCanManageUnit(user, unidadId);

        return this.prisma.asistencia.findMany({
            where: {
                deletedAt: null,
                Miembro: { unidadId },
                Actividad: {
                    deletedAt: null,
                    ...(query.desde || query.hasta
                        ? {
                            fecha: {
                                ...(query.desde ? { gte: new Date(query.desde) } : {}),
                                ...(query.hasta ? { lte: new Date(query.hasta) } : {}),
                            },
                        }
                        : {}),
                },
            },
            select: {
                id: true,
                estado: true,
                createdAt: true,
                Miembro: { select: { id: true, nombres: true, apellidos: true } },
                Actividad: { select: { id: true, titulo: true, fecha: true, tipo: true } },
            },
            orderBy: { Actividad: { fecha: 'desc' } },
        });
    }
}
