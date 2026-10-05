import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/** Retención por defecto del log de auditoría (días). */
const RETENCION_DIAS_DEFECTO = 365;

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Registra una acción en el log de auditoría global.
     * No lanza excepciones — la auditoría nunca debe bloquear operaciones.
     */
    async logAction(data: {
        actorId?: string;
        action: string;
        module: string;
        targetId?: string;
        description?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void> {
        try {
            await this.prisma.auditLog.create({ data });
        } catch (err) {
            console.error('[AuditService] Error al registrar auditoría:', err);
        }
    }

    /** Devuelve registros de auditoría paginados */
    async findRecent(limit = 50, page = 1) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
                include: {
                    actor: {
                        select: { id: true, nombre: true, email: true },
                    },
                },
            }),
            this.prisma.auditLog.count(),
        ]);

        return { data, total, page, limit };
    }

    // ─────────────────────────────────────────────
    // F4.6 · Retención del log de auditoría
    // ─────────────────────────────────────────────

    /** Días de retención configurados (env `AUDIT_RETENTION_DAYS`, defecto 365). */
    retencionDias(): number {
        const crudo = Number(process.env.AUDIT_RETENTION_DAYS ?? RETENCION_DIAS_DEFECTO);
        if (!Number.isFinite(crudo)) return RETENCION_DIAS_DEFECTO;
        return Math.floor(crudo);
    }

    /**
     * Elimina (hard delete) los registros de auditoría anteriores al corte.
     * `dias <= 0` deshabilita la retención y no borra nada.
     */
    async purgarRetencion(dias = this.retencionDias()) {
        const retorno = Math.floor(dias);

        if (retorno <= 0) {
            return { dias: retorno, desde: null, eliminados: 0, deshabilitado: true };
        }

        const desde = new Date(Date.now() - retorno * 24 * 60 * 60 * 1000);
        const { count } = await this.prisma.auditLog.deleteMany({
            where: { createdAt: { lt: desde } },
        });

        if (count > 0) {
            this.logger.log(
                `Retención de auditoría: ${count} registro(s) anteriores a ${desde.toISOString()} eliminados (retención ${retorno} días)`,
            );
        }

        return { dias: retorno, desde, eliminados: count, deshabilitado: false };
    }

    /** Ejecución programada: todos los días a las 03:00. */
    @Cron('0 0 3 * * *')
    async retencionProgramada(): Promise<void> {
        try {
            await this.purgarRetencion();
        } catch (err) {
            this.logger.error('Fallo el job de retención de auditoría', err as Error);
        }
    }
}
