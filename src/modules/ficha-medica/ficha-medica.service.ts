import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFichaMedicaDto } from './dto/create-ficha-medica.dto';
import { UpdateFichaMedicaDto } from './dto/update-ficha-medica.dto';
import { AuditService } from '../audit/audit.service';
import { FichaMedica, Prisma } from '@prisma/client';

@Injectable()
export class FichaMedicaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) {}

    private readonly includeRelations = {
        Miembro: true,
        Alergias: { where: { deletedAt: null } },
        Medicamentos: { where: { deletedAt: null } },
        Condiciones: { where: { deletedAt: null } },
        Vacunas: { where: { deletedAt: null } },
    } as const;

    async create(dto: CreateFichaMedicaDto, userId: string) {
        const miembro = await this.prisma.miembro.findFirst({
            where: { id: dto.miembroId, deletedAt: null },
        });
        if (!miembro) {
            throw new NotFoundException('El miembro especificado no existe');
        }

        const existing = await this.prisma.fichaMedica.findUnique({
            where: { miembroId: dto.miembroId },
        });
        if (existing) {
            throw new ConflictException('El miembro ya tiene una ficha médica registrada');
        }

        const data: Prisma.FichaMedicaCreateInput = {
            ...this.toScalarData(dto) as any,
            consentimientoFecha: dto.consentimiento
                ? dto.consentimientoFecha
                    ? new Date(dto.consentimientoFecha)
                    : new Date()
                : dto.consentimientoFecha
                    ? new Date(dto.consentimientoFecha)
                    : null,
            Miembro: { connect: { id: dto.miembroId } },
            createdBy: userId,
        };

        if (dto.alergiasDetalle?.length) {
            data.Alergias = { create: dto.alergiasDetalle.map(a => this.alergiaData(a, userId)) };
        }
        if (dto.medicamentosDetalle?.length) {
            data.Medicamentos = { create: dto.medicamentosDetalle.map(m => this.medicamentoData(m, userId)) };
        }
        if (dto.condicionesDetalle?.length) {
            data.Condiciones = { create: dto.condicionesDetalle.map(c => this.condicionData(c, userId)) };
        }
        if (dto.vacunasDetalle?.length) {
            data.Vacunas = { create: dto.vacunasDetalle.map(v => this.vacunaData(v, userId)) };
        }

        const ficha = await this.prisma.fichaMedica.create({
            data,
            include: this.includeRelations,
        });

        await this.auditService.logAction({
            actorId: userId,
            action: 'FICHA_MEDICA_CREATED',
            module: 'ficha-medica',
            targetId: ficha.id,
            description: `Ficha médica creada para el miembro ${dto.miembroId}`,
        });

        return ficha;
    }

    async findAll() {
        return this.prisma.fichaMedica.findMany({
            where: { deletedAt: null },
            include: this.includeRelations,
        });
    }

    async findByMiembro(miembroId: string) {
        const ficha = await this.prisma.fichaMedica.findFirst({
            where: { miembroId, deletedAt: null },
            include: this.includeRelations,
        });
        if (!ficha) {
            throw new NotFoundException('Ficha médica no encontrada para este miembro');
        }
        return ficha;
    }

    async findOne(id: string) {
        const ficha = await this.prisma.fichaMedica.findFirst({
            where: { id, deletedAt: null },
            include: this.includeRelations,
        });
        if (!ficha) {
            throw new NotFoundException('Ficha médica no encontrada');
        }
        return ficha;
    }

    async update(id: string, dto: UpdateFichaMedicaDto, userId: string) {
        const existing = await this.findOne(id);

        const data: Prisma.FichaMedicaUpdateInput = {
            ...this.toScalarData(dto) as any,
            updatedBy: userId,
        };

        if (dto.consentimiento !== undefined || dto.consentimientoFecha !== undefined) {
            // Si se marca consentimiento sin fecha, se registra la fecha actual
            if (dto.consentimiento === true && !dto.consentimientoFecha && !existing.consentimientoFecha) {
                data.consentimiento = true;
                data.consentimientoFecha = new Date();
            } else if (dto.consentimientoFecha) {
                data.consentimientoFecha = new Date(dto.consentimientoFecha);
            }
        }

        // Tablas hijas: crear / actualizar / eliminar (soft)
        if (dto.alergiasDetalle) {
            await this.syncChildren(
                this.prisma.alergiaFichaMedica,
                existing.id,
                dto.alergiasDetalle,
                (item) => this.alergiaData(item, userId),
            );
        }
        if (dto.medicamentosDetalle) {
            await this.syncChildren(
                this.prisma.medicamentoFichaMedica,
                existing.id,
                dto.medicamentosDetalle,
                (item) => this.medicamentoData(item, userId),
            );
        }
        if (dto.condicionesDetalle) {
            await this.syncChildren(
                this.prisma.condicionFichaMedica,
                existing.id,
                dto.condicionesDetalle,
                (item) => this.condicionData(item, userId),
            );
        }
        if (dto.vacunasDetalle) {
            await this.syncChildren(
                this.prisma.vacunaFichaMedica,
                existing.id,
                dto.vacunasDetalle,
                (item) => this.vacunaData(item, userId),
            );
        }

        const ficha = await this.prisma.fichaMedica.update({
            where: { id },
            data,
            include: this.includeRelations,
        });

        await this.auditService.logAction({
            actorId: userId,
            action: 'FICHA_MEDICA_UPDATED',
            module: 'ficha-medica',
            targetId: ficha.id,
            description: `Ficha médica actualizada para el miembro ${existing.miembroId}`,
        });

        return ficha;
    }

    async remove(id: string, userId: string) {
        const existing = await this.findOne(id);
        return this.prisma.fichaMedica.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: userId },
        }).then(async (ficha) => {
            await this.auditService.logAction({
                actorId: userId,
                action: 'FICHA_MEDICA_DELETED',
                module: 'ficha-medica',
                targetId: existing.id,
                description: `Ficha médica eliminada (soft delete) para el miembro ${existing.miembroId}`,
            });
            return ficha;
        });
    }

    // ─── Helpers ─────────────────────────────────────────────

    private toScalarData(dto: any): Record<string, any> {
        const data: any = {};
        const scalarKeys = [
            'tipoSangre', 'telefono', 'email', 'medicoTratante', 'telefonoMedico',
            'seguroCompania', 'seguroPoliza', 'contactoEmergenciaNombre',
            'contactoEmergenciaTelefono', 'contactoEmergenciaParentesco',
            'alergias', 'medicamentos', 'condiciones', 'observaciones',
            'consentimiento', 'consentimientoObservaciones',
        ];
        const dateKeys = ['seguroVigencia', 'consentimientoFecha'];

        for (const key of scalarKeys) {
            if (dto[key] !== undefined) data[key] = dto[key];
        }
        for (const key of dateKeys) {
            if (dto[key] !== undefined) data[key] = dto[key] ? new Date(dto[key]) : null;
        }
        return data;
    }

    private alergiaData(item: any, userId: string) {
        return {
            nombre: item.nombre,
            severidad: item.severidad,
            reaccion: item.reaccion,
            observaciones: item.observaciones,
            createdBy: userId,
            updatedBy: userId,
        };
    }

    private medicamentoData(item: any, userId: string) {
        return {
            nombre: item.nombre,
            dosis: item.dosis,
            frecuencia: item.frecuencia,
            motivo: item.motivo,
            prescritoPor: item.prescritoPor,
            createdBy: userId,
            updatedBy: userId,
        };
    }

    private condicionData(item: any, userId: string) {
        return {
            nombre: item.nombre,
            descripcion: item.descripcion,
            fechaDiagnostico: item.fechaDiagnostico ? new Date(item.fechaDiagnostico) : null,
            requiereControl: item.requiereControl !== undefined ? item.requiereControl : false,
            createdBy: userId,
            updatedBy: userId,
        };
    }

    private vacunaData(item: any, userId: string) {
        return {
            nombre: item.nombre,
            fechaAplicacion: item.fechaAplicacion ? new Date(item.fechaAplicacion) : null,
            lote: item.lote,
            observaciones: item.observaciones,
            createdBy: userId,
            updatedBy: userId,
        };
    }

    /**
     * Sincroniza una tabla hija: crea los items sin `id`, actualiza los que tienen
     * `id` (no marcados para eliminar) y aplica soft delete a los marcados `eliminar`.
     */
    private async syncChildren(
        model: any,
        fichaId: string,
        items: any[],
        mapData: (item: any) => any,
    ): Promise<void> {
        for (const item of items) {
            if (item.id) {
                if (item.eliminar) {
                    await model.update({
                        where: { id: item.id },
                        data: { deletedAt: new Date() },
                    });
                } else {
                    const { id: _id, eliminar: _eliminar, ...rest } = item;
                    await model.update({
                        where: { id: item.id },
                        data: rest,
                    });
                }
            } else {
                await model.create({
                    data: {
                        fichaMedicaId: fichaId,
                        ...mapData(item),
                    },
                });
            }
        }
    }
}
