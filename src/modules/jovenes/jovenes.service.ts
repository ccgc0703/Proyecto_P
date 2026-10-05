import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJovenDto } from './dto/create-joven.dto';
import { UpdateJovenDto } from './dto/update-joven.dto';
import { CreateAccountDto } from '../adultos/dto/create-account.dto';
import { AuditService } from '../audit/audit.service';
import { UnitAccessPolicy } from '../../common/policies/unit-access.policy';
import { UsersService } from '../users/users.service';
import { RBAC_ROLES } from '../../common/constantes';
import {
    OpcionesLista,
    hayPaginacion,
    rangoLista,
    filtroBusqueda,
} from '../../common/paginacion';

const CAMPOS_BUSQUEDA_JOVEN = ['nombres', 'apellidos', 'cedula'];

const UNIT_AGE_RANGES: Record<string, { min: number; max: number }> = {
    Manada: { min: 6, max: 10 },
    Tropa: { min: 10, max: 15 },
    Comunidad: { min: 15, max: 18 },
    Clan: { min: 18, max: 21 },
};

@Injectable()
export class JovenesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
        private readonly unitAccess: UnitAccessPolicy,
        private readonly usersService: UsersService,
    ) {
    }

    private async validateUnitAccess(actorId: string, unidadId: string): Promise<void> {
        await this.unitAccess.assertCanAccessUnit(actorId, unidadId);
    }

    private validateAgeForUnit(fechaNacimiento: Date, unidadNombre: string): void {
        const range = UNIT_AGE_RANGES[unidadNombre];
        if (!range) return;

        const today = new Date();
        let age = today.getFullYear() - fechaNacimiento.getFullYear();
        const m = today.getMonth() - fechaNacimiento.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < fechaNacimiento.getDate())) age--;

        if (age < range.min || age > range.max) {
            throw new BadRequestException(
                `El miembro tiene ${age} años. La unidad "${unidadNombre}" acepta edades de ${range.min} a ${range.max} años.`
            );
        }
    }

    private baseWhereJoven(unidadId?: string, opts?: OpcionesLista, unidadIds?: string[]) {
        return {
            tipo: 'JOVEN' as const,
            deletedAt: null,
            ...(unidadId ? { unidadId } : {}),
            ...(unidadIds ? { unidadId: { in: unidadIds } } : {}),
            ...(filtroBusqueda(opts?.q, CAMPOS_BUSQUEDA_JOVEN) ?? {}),
        };
    }

    private proyectarMiembro(miembros: any[]) {
        return miembros.map(m => {
            const { Joven, DatosScout, ...rest } = m;
            return {
                ...rest,
                ...(Joven || {}),
                ...(DatosScout || {}),
                id: m.id,
            };
        });
    }

    private readonly MIEMBRO_INCLUDE = {
        Unidad: true,
        Joven: {
            include: { Representante: true }
        },
        FichaMedica: true,
        DatosScout: true,
    };

    /**
     * Listado paginado (opt-in). Sin page/limit devuelve la lista completa
     * como siempre; con page/limit aplica skip/take y devuelve total.
     */
    async findAllByUnit(unidadId: string, opts?: OpcionesLista) {
        const where = this.baseWhereJoven(unidadId, opts);

        if (!hayPaginacion(opts ?? {})) {
            const miembros = await this.prisma.miembro.findMany({
                where,
                include: this.MIEMBRO_INCLUDE,
            });
            return { data: this.proyectarMiembro(miembros), total: miembros.length };
        }

        const [miembros, total] = await Promise.all([
            this.prisma.miembro.findMany({
                where,
                include: this.MIEMBRO_INCLUDE,
                orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
                ...rangoLista(opts!),
            }),
            this.prisma.miembro.count({ where }),
        ]);
        return { data: this.proyectarMiembro(miembros), total };
    }

    /**
     * Listado global con filtro opcional de ámbito (F4.3).
     * `unidadIds` (incluso vacío) restringe el resultado a esas unidades.
     */
    async findAll(opts?: OpcionesLista, unidadIds?: string[]) {
        const where = this.baseWhereJoven(undefined, opts, unidadIds);

        if (!hayPaginacion(opts ?? {})) {
            const miembros = await this.prisma.miembro.findMany({
                where,
                include: this.MIEMBRO_INCLUDE,
            });
            return { data: this.proyectarMiembro(miembros), total: miembros.length };
        }

        const [miembros, total] = await Promise.all([
            this.prisma.miembro.findMany({
                where,
                include: this.MIEMBRO_INCLUDE,
                orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
                ...rangoLista(opts!),
            }),
            this.prisma.miembro.count({ where }),
        ]);
        return { data: this.proyectarMiembro(miembros), total };
    }

    async findOne(id: string) {
        const miembro = await this.prisma.miembro.findFirst({
            where: { id, deletedAt: null, tipo: 'JOVEN' },
            include: {
                Unidad: true,
                FichaMedica: {
                    where: { deletedAt: null }
                },
                Condecoraciones: {
                    where: { deletedAt: null },
                    include: { Condecoracion: true },
                },
                Joven: {
                    include: {
                        Representante: true,
                        Progresiones: {
                            where: { deletedAt: null },
                            orderBy: { fechaInicio: 'desc' },
                            include: { Adelanto: true },
                        }
                    }
                },
                DatosScout: true,
            },
        });
        if (!miembro) {
            throw new NotFoundException(`Joven con ID ${id} no encontrado`);
        }

        const { Joven, DatosScout, ...rest } = miembro;
        return {
            ...rest,
            ...Joven,
            ...DatosScout,
            id: miembro.id,
            Progresiones: Joven ? Joven.Progresiones : [],
            Representante: Joven ? Joven.Representante : null,
        };
    }

    async createJoven(createJovenDto: CreateJovenDto, userId: string, userRol: string, userUnidadId?: string) {
        await this.validateUnitAccess(userId, createJovenDto.unidadId);

        const unidad = await this.prisma.unidad.findFirst({
            where: { id: createJovenDto.unidadId, deletedAt: null },
            select: { nombre: true },
        });
        if (unidad) {
            this.validateAgeForUnit(new Date(createJovenDto.fechaNacimiento), unidad.nombre);
        }

        const miembro = await this.prisma.miembro.create({
            data: {
                nombres: createJovenDto.nombres,
                apellidos: createJovenDto.apellidos,
                cedula: createJovenDto.cedula,
                fechaNacimiento: new Date(createJovenDto.fechaNacimiento),
                genero: createJovenDto.genero,
                tipo: 'JOVEN',
                estado: (createJovenDto.estado as any) || 'ACTIVO',
                unidadId: createJovenDto.unidadId,
                createdBy: userId,
                Joven: {
                    create: {
                        representanteId: createJovenDto.representanteId,
                        historial: createJovenDto.historial,
                    }
                },
                DatosScout: {
                    create: {
                        fechaIngreso: createJovenDto.fechaIngreso ? new Date(createJovenDto.fechaIngreso) : null,
                        fechaPromesa: createJovenDto.fechaPromesa ? new Date(createJovenDto.fechaPromesa) : null,
                        cargoActual: createJovenDto.cargoActual || null,
                        patrullaId: createJovenDto.patrullaId || null,
                    }
                } as any
            },
            include: { Joven: true, DatosScout: true }
        });

        await this.auditService.logAction({
            actorId: userId,
            action: 'JOVEN_CREATED',
            module: 'jovenes',
            targetId: miembro.id,
            description: 'Joven registrado',
        });

        return { 
            ...miembro, 
            ...(miembro as any).Joven, 
            ...(miembro as any).DatosScout, 
            id: miembro.id 
        };
    }

    async updateJoven(id: string, dto: UpdateJovenDto, actorId: string) {
        const miembro = await this.findOne(id);

        await this.validateUnitAccess(actorId, miembro.unidadId);

        if (dto.unidadId && dto.unidadId !== miembro.unidadId) {
            await this.validateUnitAccess(actorId, dto.unidadId);
        }

        // Validar edad si cambia fecha de nacimiento o unidad
        if (dto.fechaNacimiento || dto.unidadId) {
            const targetUnidadId = dto.unidadId || miembro.unidadId;
            const targetFecha = dto.fechaNacimiento || miembro.fechaNacimiento;
            const unidad = await this.prisma.unidad.findFirst({
                where: { id: targetUnidadId, deletedAt: null },
                select: { nombre: true },
            });
            if (unidad) {
                this.validateAgeForUnit(new Date(targetFecha), unidad.nombre);
            }
        }

        const miembroData: any = {};
        if (dto.nombres !== undefined) miembroData.nombres = dto.nombres;
        if (dto.apellidos !== undefined) miembroData.apellidos = dto.apellidos;
        if (dto.fechaNacimiento !== undefined) miembroData.fechaNacimiento = new Date(dto.fechaNacimiento);
        if (dto.unidadId !== undefined) miembroData.unidadId = dto.unidadId;
        if (dto.cedula !== undefined) miembroData.cedula = dto.cedula;
        if (dto.genero !== undefined) miembroData.genero = dto.genero;
        if (dto.estado !== undefined) miembroData.estado = dto.estado;
        miembroData.updatedBy = actorId;

        const jovenData: any = {};
        if (dto.representanteId !== undefined) jovenData.representanteId = dto.representanteId;
        if (dto.historial !== undefined) jovenData.historial = dto.historial;

        const dataToUpdate: any = { ...miembroData };
        if (Object.keys(jovenData).length > 0) {
            dataToUpdate.Joven = {
                update: jovenData
            };
        }

        // Datos Scout update
        const scoutData: any = {};
        if (dto.fechaIngreso !== undefined) scoutData.fechaIngreso = dto.fechaIngreso ? new Date(dto.fechaIngreso) : null;
        if (dto.fechaPromesa !== undefined) scoutData.fechaPromesa = dto.fechaPromesa ? new Date(dto.fechaPromesa) : null;
        if (dto.cargoActual !== undefined) scoutData.cargoActual = dto.cargoActual;
        if (dto.patrullaId !== undefined) scoutData.patrullaId = dto.patrullaId;

        if (Object.keys(scoutData).length > 0) {
            dataToUpdate.DatosScout = {
                upsert: {
                    create: scoutData,
                    update: scoutData,
                }
            } as any;
        }

        const updated = await this.prisma.miembro.update({
            where: { id },
            data: dataToUpdate,
            include: { Joven: true, DatosScout: true }
        });

        await this.auditService.logAction({
            actorId,
            action: 'JOVEN_UPDATED',
            module: 'jovenes',
            targetId: updated.id,
            description: 'Joven actualizado',
        });

        return { 
            ...updated, 
            ...(updated as any).Joven, 
            ...(updated as any).DatosScout, 
            id: updated.id 
        };
    }

    async removeJoven(id: string, actorId: string) {
        const miembro = await this.findOne(id);
        await this.validateUnitAccess(actorId, miembro.unidadId);
        
        const result = await this.prisma.miembro.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: actorId }
        });

        await this.auditService.logAction({
            actorId,
            action: 'JOVEN_DELETED',
            module: 'jovenes',
            targetId: id,
            description: 'Joven eliminado (soft delete)',
        });

        return result;
    }

    async getStats(unidadIds?: string[]) {
        const base = {
            tipo: 'JOVEN' as const,
            deletedAt: null,
            ...(unidadIds ? { unidadId: { in: unidadIds } } : {}),
        };

        const totalJovenes = await this.prisma.miembro.count({ where: base });

        const [manada, tropa, comunidad, clan] = await Promise.all([
            this.prisma.miembro.count({
                where: { ...base, Unidad: { nombre: 'Manada' } }
            }),
            this.prisma.miembro.count({
                where: { ...base, Unidad: { nombre: 'Tropa' } }
            }),
            this.prisma.miembro.count({
                where: { ...base, Unidad: { nombre: 'Comunidad' } }
            }),
            this.prisma.miembro.count({
                where: { ...base, Unidad: { nombre: 'Clan' } }
            }),
        ]);

        return {
            totalJovenes,
            manada,
            tropa,
            comunidad,
            clan,
        };
    }

    /**
     * Crea la cuenta de acceso (Usuario) de un joven y la vincula a su
     * registro Joven. Asigna obligatoriamente el rol JOVEN (self-scope).
     * El rol recibido en el DTO se ignora a propósito: una cuenta joven
     * solo puede tener el rol JOVEN.
     */
    async createAccount(miembroId: string, dto: CreateAccountDto, creatorId: string) {
        const miembro = await this.prisma.miembro.findFirst({
            where: { id: miembroId, deletedAt: null, tipo: 'JOVEN' },
            include: { Joven: true },
        });
        if (!miembro) throw new NotFoundException('Joven no encontrado');
        if (!miembro.Joven) throw new BadRequestException('El miembro no tiene ficha de joven');
        if (miembro.Joven.usuarioId) {
            throw new ConflictException('El joven ya tiene una cuenta de usuario vinculada');
        }

        const user = await this.usersService.create(
            {
                nombre: miembro.nombres,
                apellido: miembro.apellidos,
                email: dto.email,
                password: dto.password,
                unidadId: miembro.unidadId,
            },
            creatorId,
        );

        const rolJoven = await this.prisma.rol.findUnique({
            where: { nombre: RBAC_ROLES.JOVEN },
        });
        if (rolJoven) {
            await this.prisma.usuarioRol.create({
                data: { usuarioId: user.id, rolId: rolJoven.id, asignadoPor: creatorId },
            });
        }

        await this.prisma.joven.update({
            where: { id: miembro.Joven.id },
            data: { usuarioId: user.id },
        });

        await this.auditService.logAction({
            actorId: creatorId,
            action: 'JOVEN_ACCOUNT_CREATED',
            module: 'jovenes',
            targetId: miembroId,
            description: `Cuenta de acceso creada para el joven (${dto.email})`,
        });

        return this.findOne(miembroId);
    }
}
