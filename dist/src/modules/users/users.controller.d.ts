import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    findAll(): Promise<{
        success: boolean;
        message: string;
        data: {
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
        }[];
    }>;
    findOne(id: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    update(id: string, updateUserDto: UpdateUserDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    changePassword(id: string, body: {
        currentPassword: string;
        newPassword: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
