import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UnitPolicy } from '../../common/policies/unit.policy';
import { CreateDatosScoutDto } from './dto/create-datos-scout.dto';
import { UpdateDatosScoutDto } from './dto/update-datos-scout.dto';

/** Usuario enriquecido por JwtStrategy (req.user). */
export interface Actor {
    id: string;
    roles: string[];
    unidadId?: string | null;
    nodoId?: string | null;
}

const DATOS_SCOUT_INCLUDE = {
    Patrulla: { select: { id: true, nombre: true, color: true } },
};

/** Convierte una fecha ISO opcional a `Date` (o `null` para limpiarla). */
const aFecha = (valor?: string | null): Date | null => (valor ? new Date(valor) : null);

@Injectable()
export class DatosScoutService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
        private readonly unitPolicy: UnitPolicy,
    ) { }

    /**
     * `AuditService.logAction` nunca rechaza (captura y loguea sus errores), así
     * que se espera: el evento queda escrito antes de responder y no se pierde
     * si el proceso termina justo después.
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
            module: 'datos-scout',
            targetId,
            description,
        });
    }

    // ── Alcance por unidad del miembro (ABAC) ──────────────────────────

    /**
     * - alcance null → visión global (sin filtro).
     * - alcance array → solo expedientes de miembros de esas unidades.
     */
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

    /** Fail-closed para lecturas puntuales: fuera del alcance → 404. */
    private async asegurarVisibilidad(unidadId: string | null | undefined, user?: Actor): Promise<void> {
        if (!user || !unidadId) return;
        const alcance = await this.unitPolicy.unidadesAlcance(user);
        if (alcance !== null && !alcance.includes(unidadId)) {
            throw new NotFoundException('Datos scout no encontrados para este miembro');
        }
    }

    /** La patrulla, si se indica, debe existir y ser de la unidad del miembro. */
    private async validarPatrulla(patrullaId: string, unidadId: string): Promise<void> {
        const patrulla = await this.prisma.patrulla.findFirst({
            where: { id: patrullaId, deletedAt: null },
            select: { id: true, unidadId: true },
        });
        if (!patrulla) throw new NotFoundException('Patrulla no encontrada');
        if (patrulla.unidadId !== unidadId) {
            throw new BadRequestException('La patrulla no pertenece a la unidad del miembro');
        }
    }

    /** Normaliza los campos mutables (trim de texto, fechas a `Date`). */
    private normalizar(dto: UpdateDatosScoutDto): any {
        const data: any = {};
        if (dto.fechaRegistro !== undefined) data.fechaRegistro = aFecha(dto.fechaRegistro);
        if (dto.fechaIngreso !== undefined) data.fechaIngreso = aFecha(dto.fechaIngreso);
        if (dto.fechaPromesa !== undefined) data.fechaPromesa = aFecha(dto.fechaPromesa);
        if (dto.cargoActual !== undefined) data.cargoActual = dto.cargoActual?.trim() || null;
        if (dto.observaciones !== undefined) data.observaciones = dto.observaciones?.trim() || null;
        if (dto.patrullaId !== undefined) data.patrullaId = dto.patrullaId || null;
        return data;
    }

    // ── Consultas ──────────────────────────────────────────────────────

    async findAll(user?: Actor) {
        const alcance = user ? await this.unitPolicy.unidadesAlcance(user) : null;
        return this.prisma.datosScout.findMany({
            where: this.whereAlcance(alcance),
            include: DATOS_SCOUT_INCLUDE,
            orderBy: { Miembro: { apellidos: 'asc' } },
        });
    }

    async findByMiembro(miembroId: string, user?: Actor) {
        const miembro = await this.miembroConUnidad(miembroId);
        await this.asegurarVisibilidad(miembro.unidadId, user);

        const data = await this.prisma.datosScout.findFirst({
            where: { miembroId, Miembro: { deletedAt: null } },
            include: DATOS_SCOUT_INCLUDE,
        });
        if (!data) throw new NotFoundException('Datos scout no encontrados para este miembro');
        return data;
    }

    // ── Mutaciones ─────────────────────────────────────────────────────

    async crear(dto: CreateDatosScoutDto, user: Actor) {
        const miembro = await this.miembroConUnidad(dto.miembroId);
        await this.unitPolicy.assertCanManageUnit(user, miembro.unidadId);

        const existente = await this.prisma.datosScout.findUnique({
            where: { miembroId: miembro.id },
            select: { id: true },
        });
        if (existente) {
            throw new ConflictException('El miembro ya tiene un expediente scout registrado');
        }

        if (dto.patrullaId) await this.validarPatrulla(dto.patrullaId, miembro.unidadId);

        const data = this.normalizar(dto);
        const datos = await this.prisma.datosScout.create({
            data: { miembroId: miembro.id, ...data },
            include: DATOS_SCOUT_INCLUDE,
        });

        await this.registrar(
            user?.id,
            'DATOS_SCOUT_CREATED',
            datos.id,
            `Expediente scout de ${miembro.nombres} ${miembro.apellidos} registrado`,
        );
        return datos;
    }

    /**
     * Upsert por miembro: el alta de un joven ya crea su `DatosScout` vacío, así
     * que la edición del expediente debe funcionar aunque la fila no exista.
     */
    async actualizarPorMiembro(miembroId: string, dto: UpdateDatosScoutDto, user: Actor) {
        const miembro = await this.miembroConUnidad(miembroId);
        await this.unitPolicy.assertCanManageUnit(user, miembro.unidadId);

        if (dto.patrullaId) await this.validarPatrulla(dto.patrullaId, miembro.unidadId);

        const data = this.normalizar(dto);
        const datos = await this.prisma.datosScout.upsert({
            where: { miembroId: miembro.id },
            create: { miembroId: miembro.id, ...data },
            update: data,
            include: DATOS_SCOUT_INCLUDE,
        });

        await this.registrar(
            user?.id,
            'DATOS_SCOUT_UPDATED',
            datos.id,
            `Expediente scout de ${miembro.nombres} ${miembro.apellidos} actualizado`,
        );
        return datos;
    }
}
