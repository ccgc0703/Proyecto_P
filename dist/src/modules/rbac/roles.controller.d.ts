import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    createRole(createRoleDto: CreateRoleDto): Promise<{
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
        };
    }>;
    findAll(): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            nombre: string;
            descripcion: string;
            activo: boolean;
            createdAt: Date;
            totalUsuarios: number;
            permisos: {
                id: string;
                descripcion: string;
                accion: string;
                modulo: string;
            }[];
        }[];
    }>;
    assignPermissions(roleId: string, dto: AssignPermissionsDto): Promise<{
        success: boolean;
        message: string;
        data: {
            rolId: string;
            rolNombre: string;
            permisosAsignados: {
                id: string;
                descripcion: string;
                accion: string;
                modulo: string;
            }[];
        };
    }>;
}
