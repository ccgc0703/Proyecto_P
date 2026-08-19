import { PrismaService } from '../prisma/prisma.service';
import { CreateFichaMedicaDto } from './dto/create-ficha-medica.dto';
import { UpdateFichaMedicaDto } from './dto/update-ficha-medica.dto';
export declare class FichaMedicaService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateFichaMedicaDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        miembroId: string;
        tipoSangre: string | null;
        alergias: string | null;
        medicamentos: string | null;
        condiciones: string | null;
        seguro: string | null;
        contactoEmergencia: string | null;
    }>;
    findAll(): Promise<({
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        miembroId: string;
        tipoSangre: string | null;
        alergias: string | null;
        medicamentos: string | null;
        condiciones: string | null;
        seguro: string | null;
        contactoEmergencia: string | null;
    })[]>;
    findByMiembro(miembroId: string): Promise<{
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        miembroId: string;
        tipoSangre: string | null;
        alergias: string | null;
        medicamentos: string | null;
        condiciones: string | null;
        seguro: string | null;
        contactoEmergencia: string | null;
    }>;
    findOne(id: string): Promise<{
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        miembroId: string;
        tipoSangre: string | null;
        alergias: string | null;
        medicamentos: string | null;
        condiciones: string | null;
        seguro: string | null;
        contactoEmergencia: string | null;
    }>;
    update(id: string, dto: UpdateFichaMedicaDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        miembroId: string;
        tipoSangre: string | null;
        alergias: string | null;
        medicamentos: string | null;
        condiciones: string | null;
        seguro: string | null;
        contactoEmergencia: string | null;
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        miembroId: string;
        tipoSangre: string | null;
        alergias: string | null;
        medicamentos: string | null;
        condiciones: string | null;
        seguro: string | null;
        contactoEmergencia: string | null;
    }>;
}
