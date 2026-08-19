import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../../common/base.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditService } from '../audit/audit.service';
export declare class UsersService extends BaseService<any> {
    private readonly auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    findAll(where?: any): Promise<{
        roles: string[];
        Unidad: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            descripcion: string | null;
            tipo: string | null;
        };
        UsuarioRoles: ({
            Rol: {
                id: string;
                nombre: string;
                activo: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                createdBy: string | null;
                descripcion: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            usuarioId: string;
            rolId: string;
            asignadoPor: string | null;
        })[];
        Adulto: {
            Miembro: {
                id: string;
                unidadId: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                createdBy: string | null;
                updatedBy: string | null;
                tipo: import(".prisma/client").$Enums.TipoMiembro;
                nombres: string;
                apellidos: string;
                cedula: string;
                fechaNacimiento: Date;
                genero: import(".prisma/client").$Enums.Genero;
                estado: import(".prisma/client").$Enums.EstadoMiembro;
            };
        } & {
            id: string;
            usuarioId: string | null;
            miembroId: string;
            ocupacion: string | null;
            telefono: string | null;
            direccion: string | null;
        };
        id: string;
        nombre: string;
        apellido: string | null;
        email: string;
        fotoUrl: string | null;
        unidadId: string | null;
        activo: boolean;
        tokenVersion: number;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
    }[]>;
    findOne(id: string): Promise<any>;
    create(createUserDto: CreateUserDto, creatorId?: string, ip?: string, userAgent?: string): Promise<any>;
    updateUser(id: string, dto: UpdateUserDto, actorId: string, ip?: string, userAgent?: string): Promise<any>;
    changePassword(id: string, currentPassword: string, newPassword: string, actorId: string, ip?: string): Promise<{
        message: string;
    }>;
    remove(id: string, userId?: string, ip?: string, userAgent?: string): Promise<any>;
    private excludePassword;
}
