import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
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
}
