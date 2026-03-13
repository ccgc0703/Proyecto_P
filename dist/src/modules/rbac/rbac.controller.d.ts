import { RbacService } from './rbac.service';
import { AssignRoleDto, AssignRoleByNameDto } from './dto/assign-role.dto';
export declare class RbacController {
    private readonly rbacService;
    constructor(rbacService: RbacService);
    listRoles(): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            nombre: string;
            activo: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            descripcion: string | null;
        }[];
    }>;
    listPermisos(): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            descripcion: string | null;
            accion: string;
            modulo: string;
        }[];
    }>;
    getUserPermissions(id: string): Promise<{
        success: boolean;
        message: string;
        data: string[];
    }>;
    assignRole(usuarioId: string, dto: AssignRoleDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            usuarioId: string;
            rolId: string;
            asignadoPor: string | null;
        };
    }>;
    revokeRole(usuarioId: string, rolId: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    assignRoleByName(dto: AssignRoleByNameDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            usuarioId: string;
            rolId: string;
            asignadoPor: string | null;
        };
    }>;
}
