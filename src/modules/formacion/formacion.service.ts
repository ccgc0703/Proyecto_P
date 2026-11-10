import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UnitPolicy } from '../../common/policies/unit.policy';
import { CreateFormacionDto } from './dto/create-formacion.dto';
import { UpdateFormacionDto } from './dto/update-formacion.dto';

/** Usuario enriquecido por JwtStrategy (req.user). */
export interface Actor {
    id: string;
    roles: string[];
    unidadId?: string | null;
    nodoId?: string | null;
}

const FORMACION_INCLUDE = {
    Adulto: {
        select: {
            id: true,
            Miembro: {
                select: { id: true, nombres: true, apellidos: true, unidadId: true },
            },
        },
    },
};

@Injectable()
export class FormacionService {
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
            module: 'formacion',
            targetId,
            description,
        });
    }

    // ── Alcance por unidad del adulto responsable (ABAC) ──────────────

    /**
     * - alcance null → visión global (sin filtro).
     * - alcance array → solo formaciones de adultos de esas unidades.
     */
    private whereAlcance(alcance: string[] | null): any {
        const where: any = { deletedAt: null };
        if (alcance !== null) {
            where.Adulto = { Miembro: { unidadId: { in: alcance } } };
        }
        return where;
    }

    private async adultoConUnidad(adultoId: string) {
        const adulto = await this.prisma.adulto.findFirst({
            where: { id: adultoId, Miembro: { deletedAt: null } },
            select: { id: true, Miembro: { select: { unidadId: true } } },
        });
        if (!adulto) throw new NotFoundException('Adulto no encontrado');
        return adulto;
    }

    /** Fail-closed para lecturas puntuales: fuera del alcance → 404. */
    private async asegurarVisibilidad(unidadId: string | null | undefined, user?: Actor): Promise<void> {
        if (!user || !unidadId) return;
        const alcance = await this.unitPolicy.unidadesAlcance(user);
        if (alcance !== null && !alcance.includes(unidadId)) {
            throw new NotFoundException('Formacion no encontrada');
        }
    }

    // ── CRUD ───────────────────────────────────────────────────────────

    async findAll(user?: Actor) {
        const alcance = user ? await this.unitPolicy.unidadesAlcance(user) : null;
        return this.prisma.formacion.findMany({
            where: this.whereAlcance(alcance),
            include: FORMACION_INCLUDE,
            orderBy: [{ fecha: 'desc' }],
        });
    }

    async listarAdultos(user?: Actor) {
        const alcance = user ? await this.unitPolicy.unidadesAlcance(user) : null;
        const where: any = { Miembro: { deletedAt: null } };
        if (alcance !== null) where.Miembro.unidadId = { in: alcance };

        const adultos = await this.prisma.adulto.findMany({
            where,
            select: {
                id: true,
                Miembro: {
                    select: {
                        nombres: true,
                        apellidos: true,
                        unidadId: true,
                        Unidad: { select: { id: true, nombre: true } },
                    },
                },
            },
            orderBy: [{ Miembro: { apellidos: 'asc' } }, { Miembro: { nombres: 'asc' } }],
        });

        return adultos.map((adulto) => ({
            id: adulto.id,
            nombres: adulto.Miembro.nombres,
            apellidos: adulto.Miembro.apellidos,
            unidadId: adulto.Miembro.unidadId,
            Unidad: adulto.Miembro.Unidad,
        }));
    }

    async findByAdulto(adultoId: string, user?: Actor) {
        const adulto = await this.adultoConUnidad(adultoId);
        await this.asegurarVisibilidad(adulto.Miembro.unidadId, user);

        return this.prisma.formacion.findMany({
            where: { adultoId, deletedAt: null },
            include: FORMACION_INCLUDE,
            orderBy: [{ fecha: 'desc' }],
        });
    }

    async obtener(id: string, user?: Actor) {
        const formacion = await this.prisma.formacion.findFirst({
            where: { id, deletedAt: null },
            include: FORMACION_INCLUDE,
        });
        if (!formacion) throw new NotFoundException('Formacion no encontrada');

        await this.asegurarVisibilidad(formacion.Adulto?.Miembro?.unidadId, user);
        return formacion;
    }

    async crear(dto: CreateFormacionDto, user: Actor) {
        const adulto = await this.adultoConUnidad(dto.adultoId);
        await this.unitPolicy.assertCanManageUnit(user, adulto.Miembro.unidadId);

        const formacion = await this.prisma.formacion.create({
            data: {
                nombre: dto.nombre.trim(),
                fecha: new Date(dto.fecha),
                director: dto.director.trim(),
                adultoId: adulto.id,
            },
            include: FORMACION_INCLUDE,
        });

        this.registrar(
            user?.id,
            'FORMACION_CREATED',
            formacion.id,
            `Formación "${formacion.nombre}" registrada`,
        );
        return formacion;
    }

    async actualizar(id: string, dto: UpdateFormacionDto, user: Actor) {
        const existente = await this.obtener(id, user);
        await this.unitPolicy.assertCanManageUnit(user, existente.Adulto.Miembro.unidadId);

        if (dto.adultoId && dto.adultoId !== existente.adultoId) {
            const nuevoAdulto = await this.adultoConUnidad(dto.adultoId);
            await this.unitPolicy.assertCanManageUnit(user, nuevoAdulto.Miembro.unidadId);
        }

        const data: any = { ...dto };
        if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
        if (dto.director !== undefined) data.director = dto.director.trim();
        if (dto.fecha !== undefined) data.fecha = new Date(dto.fecha);

        const formacion = await this.prisma.formacion.update({
            where: { id },
            data,
            include: FORMACION_INCLUDE,
        });

        this.registrar(
            user?.id,
            'FORMACION_UPDATED',
            formacion.id,
            `Formación "${formacion.nombre}" actualizada`,
        );
        return formacion;
    }

    async eliminar(id: string, user: Actor): Promise<void> {
        const formacion = await this.obtener(id, user);
        await this.unitPolicy.assertCanManageUnit(user, formacion.Adulto.Miembro.unidadId);

        await this.prisma.formacion.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        this.registrar(
            user?.id,
            'FORMACION_DELETED',
            formacion.id,
            `Formación "${formacion.nombre}" eliminada`,
        );
    }
}
