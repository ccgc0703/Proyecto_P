import { AdultosService } from './adultos.service';
import { CreateAdultoDto } from './dto/create-adulto.dto';
import { UpdateAdultoDto } from './dto/update-adulto.dto';
import { CreateAccountDto } from './dto/create-account.dto';
export declare class AdultosController {
    private readonly adultosService;
    constructor(adultosService: AdultosService);
    findAll(): Promise<{
        email: string;
        activo: boolean;
        roles: string[];
        Unidad: {
            id: string;
            tipo: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nombre: string;
            descripcion: string | null;
        };
        Usuario: {
            UsuarioRoles: ({
                Rol: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    createdBy: string | null;
                    nombre: string;
                    activo: boolean;
                    descripcion: string | null;
                };
            } & {
                id: string;
                usuarioId: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                rolId: string;
                asignadoPor: string | null;
            })[];
        } & {
            id: string;
            unidadId: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nombre: string;
            apellido: string | null;
            email: string;
            password: string;
            fotoUrl: string | null;
            activo: boolean;
            tokenVersion: number;
        };
        id: string;
        nombres: string;
        apellidos: string;
        cedula: string;
        fechaNacimiento: Date;
        genero: import(".prisma/client").$Enums.Genero;
        tipo: import(".prisma/client").$Enums.TipoMiembro;
        estado: import(".prisma/client").$Enums.EstadoMiembro;
        unidadId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        Formaciones: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            nombre: string;
            fecha: Date;
            director: string;
            adultoId: string;
        }[];
        miembroId: string;
        usuarioId: string | null;
        ocupacion: string | null;
        telefono: string | null;
        direccion: string | null;
    }[]>;
    findOne(id: string): Promise<{
        email: string;
        activo: boolean;
        roles: string[];
        Unidad: {
            id: string;
            tipo: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nombre: string;
            descripcion: string | null;
        };
        Usuario: {
            UsuarioRoles: ({
                Rol: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    createdBy: string | null;
                    nombre: string;
                    activo: boolean;
                    descripcion: string | null;
                };
            } & {
                id: string;
                usuarioId: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                rolId: string;
                asignadoPor: string | null;
            })[];
        } & {
            id: string;
            unidadId: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nombre: string;
            apellido: string | null;
            email: string;
            password: string;
            fotoUrl: string | null;
            activo: boolean;
            tokenVersion: number;
        };
        id: string;
        nombres: string;
        apellidos: string;
        cedula: string;
        fechaNacimiento: Date;
        genero: import(".prisma/client").$Enums.Genero;
        tipo: import(".prisma/client").$Enums.TipoMiembro;
        estado: import(".prisma/client").$Enums.EstadoMiembro;
        unidadId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        Formaciones: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            nombre: string;
            fecha: Date;
            director: string;
            adultoId: string;
        }[];
        miembroId: string;
        usuarioId: string | null;
        ocupacion: string | null;
        telefono: string | null;
        direccion: string | null;
    }>;
    create(dto: CreateAdultoDto, req: any): Promise<{
        email: string;
        activo: boolean;
        roles: string[];
        Unidad: {
            id: string;
            tipo: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nombre: string;
            descripcion: string | null;
        };
        Usuario: {
            UsuarioRoles: ({
                Rol: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    createdBy: string | null;
                    nombre: string;
                    activo: boolean;
                    descripcion: string | null;
                };
            } & {
                id: string;
                usuarioId: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                rolId: string;
                asignadoPor: string | null;
            })[];
        } & {
            id: string;
            unidadId: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nombre: string;
            apellido: string | null;
            email: string;
            password: string;
            fotoUrl: string | null;
            activo: boolean;
            tokenVersion: number;
        };
        id: string;
        nombres: string;
        apellidos: string;
        cedula: string;
        fechaNacimiento: Date;
        genero: import(".prisma/client").$Enums.Genero;
        tipo: import(".prisma/client").$Enums.TipoMiembro;
        estado: import(".prisma/client").$Enums.EstadoMiembro;
        unidadId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        Formaciones: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            nombre: string;
            fecha: Date;
            director: string;
            adultoId: string;
        }[];
        miembroId: string;
        usuarioId: string | null;
        ocupacion: string | null;
        telefono: string | null;
        direccion: string | null;
    }>;
    update(id: string, dto: UpdateAdultoDto, req: any): Promise<{
        email: string;
        activo: boolean;
        roles: string[];
        Unidad: {
            id: string;
            tipo: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nombre: string;
            descripcion: string | null;
        };
        Usuario: {
            UsuarioRoles: ({
                Rol: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    createdBy: string | null;
                    nombre: string;
                    activo: boolean;
                    descripcion: string | null;
                };
            } & {
                id: string;
                usuarioId: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                rolId: string;
                asignadoPor: string | null;
            })[];
        } & {
            id: string;
            unidadId: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nombre: string;
            apellido: string | null;
            email: string;
            password: string;
            fotoUrl: string | null;
            activo: boolean;
            tokenVersion: number;
        };
        id: string;
        nombres: string;
        apellidos: string;
        cedula: string;
        fechaNacimiento: Date;
        genero: import(".prisma/client").$Enums.Genero;
        tipo: import(".prisma/client").$Enums.TipoMiembro;
        estado: import(".prisma/client").$Enums.EstadoMiembro;
        unidadId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        Formaciones: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            nombre: string;
            fecha: Date;
            director: string;
            adultoId: string;
        }[];
        miembroId: string;
        usuarioId: string | null;
        ocupacion: string | null;
        telefono: string | null;
        direccion: string | null;
    }>;
    createAccount(id: string, dto: CreateAccountDto, req: any): Promise<{
        email: string;
        activo: boolean;
        roles: string[];
        Unidad: {
            id: string;
            tipo: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nombre: string;
            descripcion: string | null;
        };
        Usuario: {
            UsuarioRoles: ({
                Rol: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    createdBy: string | null;
                    nombre: string;
                    activo: boolean;
                    descripcion: string | null;
                };
            } & {
                id: string;
                usuarioId: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                rolId: string;
                asignadoPor: string | null;
            })[];
        } & {
            id: string;
            unidadId: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nombre: string;
            apellido: string | null;
            email: string;
            password: string;
            fotoUrl: string | null;
            activo: boolean;
            tokenVersion: number;
        };
        id: string;
        nombres: string;
        apellidos: string;
        cedula: string;
        fechaNacimiento: Date;
        genero: import(".prisma/client").$Enums.Genero;
        tipo: import(".prisma/client").$Enums.TipoMiembro;
        estado: import(".prisma/client").$Enums.EstadoMiembro;
        unidadId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        Formaciones: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            nombre: string;
            fecha: Date;
            director: string;
            adultoId: string;
        }[];
        miembroId: string;
        usuarioId: string | null;
        ocupacion: string | null;
        telefono: string | null;
        direccion: string | null;
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
