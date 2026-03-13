import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(limit?: string, page?: string): Promise<{
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
        success: boolean;
        message: string;
    }>;
}
