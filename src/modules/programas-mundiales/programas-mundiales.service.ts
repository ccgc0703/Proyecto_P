import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { EstadoProgramaMundial } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UnitPolicy } from '../../common/policies/unit.policy';
import { CreateProgramaMiembroDto } from './dto/create-programa-miembro.dto';
import { UpdateProgramaMiembroDto } from './dto/update-programa-miembro.dto';

/** Usuario enriquecido por JwtStrategy (req.user). */
export interface Actor {
    id: string;
    roles: string[];
    unidadId?: string | null;
    nodoId?: string | null;
}

const INSCRIPCION_INCLUDE = { ProgramaMundial: true };

const MIEMBRO_INCLUDE = {
    select: { id: true, nombres: true, apellidos: true, unidadId: true },
};

const aFecha = (valor?: string | null): Date | null => (valor ? new Date(valor) : null);

@Injectable()
export class ProgramasMundialesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
        private readonly unitPolicy: UnitPolicy,
    ) { }

    /**
     * `AuditService.logAction` nunca rechaza, así que se espera: el evento queda
     * escrito antes de responder.
     */
    private async registrar(
        userId: string | undefined,
        action: string,
        targetId: string,
        description: string,
    ): Promise<void> {
        await this.audit.logAction({
            actorId: userId,
            action,
            module: 'programas-mundiales',
            targetId,
            description,
        });
    }

    // ── Alcance por unidad del miembro (ABAC) ──────────────────────────

    private whereAlcance(alcance: string[] | null): any {
        const where: any = { Miembro: { deletedAt: null } };
        if (alcance !== null) {
            where.Miembro.unidadId = { in: alcance };
        }
        return where;
    }

    private async miembroConUnidad(miembroId: string) {
        const miembro = await this.prisma.miembro.findFirst({
            where: { id: miembroId, deletedAt: null },
            select: { id: true, unidadId: true, nombres: true, apellidos: true },
        });
        if (!miembro) throw new NotFoundException('Miembro no encontrado');
        return miembro;
    }

    private async asegurarVisibilidad(unidadId: string | null | undefined, user?: Actor): Promise<void> {
        if (!user || !unidadId) return;
        const alcance = await this.unitPolicy.unidadesAlcance(user);
        if (alcance !== null && !alcance.includes(unidadId)) {
            throw new NotFoundException('Programas mundiales no encontrados para este miembro');
        }
    }

    private async programaDelCatalogo(programaMundialId: string) {
        const programa = await this.prisma.programaMundial.findFirst({
            where: { id: programaMundialId, deletedAt: null },
            select: { id: true, nombre: true, activo: true },
        });
        if (!programa || !programa.activo) {
            throw new NotFoundException('Programa mundial no encontrado o inactivo');
        }
        return programa;
    }

    /** Coherencia de fechas/estado, combinando lo enviado con lo ya guardado. */
    private validarEstado(
        estado: EstadoProgramaMundial | undefined,
        fechaInicio: Date | null,
        fechaCompletado: Date | null,
    ): void {
        if (fechaInicio && fechaCompletado && fechaCompletado < fechaInicio) {
            throw new BadRequestException(
                'fechaCompletado no puede ser anterior a fechaInicio',
            );
        }
        if (estado === EstadoProgramaMundial.COMPLETADO && !fechaCompletado) {
            throw new BadRequestException(
                'Un programa COMPLETADO requiere fechaCompletado',
            );
        }
    }

    /** Inscripción activa (no eliminada) con datos del miembro, o 404. */
    private async inscripcionDeMiembro(id: string) {
        const inscripcion = await this.prisma.miembroProgramaMundial.findFirst({
            where: { id, deletedAt: null },
            include: { ...INSCRIPCION_INCLUDE, Miembro: MIEMBRO_INCLUDE },
        });
        if (!inscripcion) throw new NotFoundException('Programa del miembro no encontrado');
        return inscripcion;
    }

    // ── Consultas ──────────────────────────────────────────────────────

    async findAllCatalog() {
        return this.prisma.programaMundial.findMany({
            where: { activo: true, deletedAt: null },
            orderBy: { nombre: 'asc' },
        });
    }

    /** Listado global de enlaces, filtrado por el alcance de unidades. */
    async findAll(user?: Actor) {
        const alcance = user ? await this.unitPolicy.unidadesAlcance(user) : null;
        return this.prisma.miembroProgramaMundial.findMany({
            where: { ...this.whereAlcance(alcance), deletedAt: null },
            include: { ...INSCRIPCION_INCLUDE, Miembro: MIEMBRO_INCLUDE },
            orderBy: [{ Miembro: { apellidos: 'asc' } }, { fechaInicio: 'desc' }],
        });
    }

    /** Inscripciones del miembro (array directo, compatibilidad). */
    async findByMiembro(miembroId: string, user?: Actor) {
        const miembro = await this.miembroConUnidad(miembroId);
        await this.asegurarVisibilidad(miembro.unidadId, user);

        return this.prisma.miembroProgramaMundial.findMany({
            where: { miembroId: miembro.id, deletedAt: null },
            include: INSCRIPCION_INCLUDE,
            orderBy: { fechaInicio: 'desc' },
        });
    }

    // ── Mutaciones ─────────────────────────────────────────────────────

    async crear(dto: CreateProgramaMiembroDto, user: Actor) {
        const miembro = await this.miembroConUnidad(dto.miembroId);
        await this.unitPolicy.assertCanManageUnit(user, miembro.unidadId);
        const programa = await this.programaDelCatalogo(dto.programaMundialId);

        const fechaInicio = aFecha(dto.fechaInicio)!;
        const fechaCompletado = aFecha(dto.fechaCompletado);
        const estado = dto.estado ?? EstadoProgramaMundial.PENDIENTE;
        this.validarEstado(estado, fechaInicio, fechaCompletado);

        const existente = await this.prisma.miembroProgramaMundial.findUnique({
            where: {
                miembroId_programaMundialId: {
                    miembroId: miembro.id,
                    programaMundialId: programa.id,
                },
                // Escape hatch del soft-delete: necesita ver también el enlace
                // eliminado para reactivarlo en lugar de violar el unique.
                deletedAt: undefined,
            },
            select: { id: true, deletedAt: true },
        });

        if (existente && !existente.deletedAt) {
            throw new ConflictException('El miembro ya tiene ese programa mundial registrado');
        }

        const data = { fechaInicio, fechaCompletado, estado };
        // El unique (miembro, programa) no ignora el soft-delete: si el enlace
        // estaba eliminado se reactiva en lugar de intentar insertarlo.
        const inscripcion = existente
            ? await this.prisma.miembroProgramaMundial.update({
                where: { id: existente.id },
                data: { ...data, deletedAt: null },
                include: INSCRIPCION_INCLUDE,
            })
            : await this.prisma.miembroProgramaMundial.create({
                data: { miembroId: miembro.id, programaMundialId: programa.id, ...data },
                include: INSCRIPCION_INCLUDE,
            });

        await this.registrar(
            user?.id,
            'PROGRAMA_MUNDIAL_CREATED',
            inscripcion.id,
            `${programa.nombre} enlazado a ${miembro.nombres} ${miembro.apellidos}`,
        );
        return inscripcion;
    }

    async actualizar(id: string, dto: UpdateProgramaMiembroDto, user: Actor) {
        const inscripcion = await this.inscripcionDeMiembro(id);
        await this.unitPolicy.assertCanManageUnit(user, inscripcion.Miembro.unidadId);

        const fechaInicio =
            dto.fechaInicio !== undefined ? aFecha(dto.fechaInicio) : inscripcion.fechaInicio;
        const fechaCompletado =
            dto.fechaCompletado !== undefined
                ? aFecha(dto.fechaCompletado)
                : inscripcion.fechaCompletado;
        const estado = dto.estado ?? inscripcion.estado;
        this.validarEstado(estado, fechaInicio, fechaCompletado);

        if (dto.programaMundialId && dto.programaMundialId !== inscripcion.programaMundialId) {
            await this.programaDelCatalogo(dto.programaMundialId);
            const duplicado = await this.prisma.miembroProgramaMundial.findUnique({
                where: {
                    miembroId_programaMundialId: {
                        miembroId: inscripcion.miembroId,
                        programaMundialId: dto.programaMundialId,
                    },
                },
                select: { id: true, deletedAt: true },
            });
            if (duplicado && !duplicado.deletedAt && duplicado.id !== inscripcion.id) {
                throw new ConflictException(
                    'El miembro ya tiene ese programa mundial registrado',
                );
            }
        }

        const actualizada = await this.prisma.miembroProgramaMundial.update({
            where: { id: inscripcion.id },
            data: {
                ...(dto.programaMundialId ? { programaMundialId: dto.programaMundialId } : {}),
                fechaInicio: fechaInicio ?? undefined,
                fechaCompletado,
                estado,
            },
            include: INSCRIPCION_INCLUDE,
        });

        await this.registrar(
            user?.id,
            'PROGRAMA_MUNDIAL_UPDATED',
            actualizada.id,
            `Programa mundial de ${inscripcion.Miembro.nombres} ${inscripcion.Miembro.apellidos} actualizado`,
        );
        return actualizada;
    }

    /** Soft-delete: el unique (miembro, programa) impide recrear, así que `crear` reactiva. */
    async eliminar(id: string, user: Actor) {
        const inscripcion = await this.inscripcionDeMiembro(id);
        await this.unitPolicy.assertCanManageUnit(user, inscripcion.Miembro.unidadId);

        await this.prisma.miembroProgramaMundial.update({
            where: { id: inscripcion.id },
            data: { deletedAt: new Date() },
        });

        await this.registrar(
            user?.id,
            'PROGRAMA_MUNDIAL_DELETED',
            inscripcion.id,
            `Programa mundial de ${inscripcion.Miembro.nombres} ${inscripcion.Miembro.apellidos} eliminado`,
        );
        return { id: inscripcion.id, deleted: true };
    }
}
