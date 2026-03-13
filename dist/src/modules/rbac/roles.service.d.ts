import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
export declare class RolesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createRole(dto: CreateRoleDto): Promise<{
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        descripcion: string | null;
    }>;
    findAll(): Promise<{
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
    }[]>;
    assignPermissions(roleId: string, permisoIds: string[]): Promise<{
        rolId: string;
        rolNombre: string;
        permisosAsignados: {
            id: string;
            descripcion: string;
            accion: string;
            modulo: string;
        }[];
    }>;
    findOne(roleId: string): Promise<{
        RolPermisos: ({
            Permiso: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                descripcion: string | null;
                accion: string;
                modulo: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            rolId: string;
            permisoId: string;
        })[];
    } & {
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        descripcion: string | null;
    }>;
}
