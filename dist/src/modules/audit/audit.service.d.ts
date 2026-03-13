import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    logAction(data: {
        actorId?: string;
        action: string;
        module: string;
        targetId?: string;
        description?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void>;
    findRecent(limit?: number, page?: number): Promise<{
        data: ({
            actor: {
                email: string;
                id: string;
                nombre: string;
            };
        } & {
            id: string;
            createdAt: Date;
            actorId: string | null;
            action: string;
            module: string;
            targetId: string | null;
            description: string | null;
            ipAddress: string | null;
            userAgent: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
}
