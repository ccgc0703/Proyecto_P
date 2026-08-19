import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJovenDto } from './dto/create-joven.dto';
import { UpdateJovenDto } from './dto/update-joven.dto';
import { AuditService } from '../audit/audit.service';

const ADULT_UNIT_MAP: Record<string, string> = {
    ADULTO_MANADA: 'Manada',
    ADULTO_TROPA: 'Tropa',
    ADULTO_CLAN: 'Clan',
};

const UNIT_BYPASS_ROLES = ['SYSTEM_ADMIN', 'GROUP_LEADER'];

@Injectable()
export class JovenesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) {
    }

    private async validateUnitAccess(actorId: string, unidadId: string): Promise<void> {
        const actorRoles = await this.prisma.usuarioRol.findMany({
            where: { usuarioId: actorId, deletedAt: null },
            include: { Rol: true },
        });

        const roleNames = actorRoles.map(ur => ur.Rol.nombre);

        if (roleNames.some(r => UNIT_BYPASS_ROLES.includes(r))) {
            return;
        }

        const adultRole = roleNames.find(r => r in ADULT_UNIT_MAP);
        if (!adultRole) {
            return;
        }

        const unidad = await this.prisma.unidad.findFirst({
            where: { id: unidadId, deletedAt: null },
            select: { nombre: true },
        });

        if (!unidad) return;

        const allowedUnit = ADULT_UNIT_MAP[adultRole];
        if (unidad.nombre !== allowedUnit) {
            throw new ForbiddenException('No tienes acceso a jóvenes de otra unidad');
        }
    }

    async findAllByUnit(unidadId: string) {
        const miembros = await this.prisma.miembro.findMany({
            where: {
                tipo: 'JOVEN',
                unidadId,
                deletedAt: null,
            },
            include: {
                Unidad: true,
                Joven: {
                    include: { Representante: true }
                },
                FichaMedica: {
                    where: { deletedAt: null }
                },
                DatosScout: true,
            },
        });

        return miembros.map(m => {
            const { Joven, DatosScout, ...rest } = m;
            return {
                ...rest,
                ...Joven,
                ...DatosScout,
                id: m.id, // ID del miembro es el principal
            };
        });
    }

    async findAll() {
        const miembros = await this.prisma.miembro.findMany({
            where: {
                tipo: 'JOVEN',
                deletedAt: null,
            },
            include: {
                Unidad: true,
                Joven: {
                    include: { Representante: true }
                },
                FichaMedica: {
                    where: { deletedAt: null }
                },
                DatosScout: true,
            },
        });

        return miembros.map(m => {
            const { Joven, DatosScout, ...rest } = m;
            return {
                ...rest,
                ...Joven,
                ...DatosScout,
                id: m.id,
            };
        });
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

        const miembroData: any = {};
        if (dto.nombres !== undefined) miembroData.nombres = dto.nombres;
        if (dto.apellidos !== undefined) miembroData.apellidos = dto.apellidos;
        if (dto.fechaNacimiento !== undefined) miembroData.fechaNacimiento = new Date(dto.fechaNacimiento);
        if (dto.unidadId !== undefined) miembroData.unidadId = dto.unidadId;
        if (dto.cedula !== undefined) miembroData.cedula = dto.cedula;
        if (dto.genero !== undefined) miembroData.genero = dto.genero;
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

    async getStats() {
        const totalJovenes = await this.prisma.miembro.count({ 
            where: { tipo: 'JOVEN', deletedAt: null } 
        });

        const [manada, tropa, clan] = await Promise.all([
            this.prisma.miembro.count({
                where: { tipo: 'JOVEN', deletedAt: null, Unidad: { nombre: 'Manada' } }
            }),
            this.prisma.miembro.count({
                where: { tipo: 'JOVEN', deletedAt: null, Unidad: { nombre: 'Tropa' } }
            }),
            this.prisma.miembro.count({
                where: { tipo: 'JOVEN', deletedAt: null, Unidad: { nombre: 'Clan' } }
            }),
        ]);

        return {
            totalJovenes,
            manada,
            tropa,
            clan,
        };
    }
}
