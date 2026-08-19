import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(limit?: string, page?: string): Promise<{
        data: ({
            actor: {
                id: string;
                nombre: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            action: string;
            module: string;
            targetId: string | null;
            description: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            actorId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        success: boolean;
        message: string;
    }>;
}
