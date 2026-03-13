import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AssignRoleByNameDto } from './dto/assign-role.dto';
import { AuditService } from '../audit/audit.service';
export declare class RbacService {
    private readonly prisma;
    private readonly authService;
    private readonly auditService;
    constructor(prisma: PrismaService, authService: AuthService, auditService: AuditService);
    listRoles(): Promise<{
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        descripcion: string | null;
    }[]>;
    listPermisos(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        descripcion: string | null;
        accion: string;
        modulo: string;
    }[]>;
    getUserPermissions(usuarioId: string): Promise<string[]>;
    assignRole(usuarioId: string, rolId: string, actorId: string, ip?: string): Promise<{
        message: string;
        asignacion: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            usuarioId: string;
            rolId: string;
            asignadoPor: string | null;
        };
    }>;
    assignRoleByName(dto: AssignRoleByNameDto, actorId: string, ip?: string): Promise<{
        message: string;
        asignacion: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            usuarioId: string;
            rolId: string;
            asignadoPor: string | null;
        };
    }>;
    revokeRole(usuarioId: string, rolId: string, actorId: string, ip?: string): Promise<{
        message: string;
    }>;
}
