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
        alergias: string | null;
        medicamentos: string | null;
        condiciones: string | null;
        seguro: string | null;
        contactoEmergencia: string | null;
        jovenId: string;
    }>;
    findAll(): Promise<({
        Joven: {
            id: string;
            unidadId: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nombres: string;
            apellidos: string;
            fechaNacimiento: Date;
            representanteId: string;
            estado: string;
            historial: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        alergias: string | null;
        medicamentos: string | null;
        condiciones: string | null;
        seguro: string | null;
        contactoEmergencia: string | null;
        jovenId: string;
    })[]>;
    findByJoven(jovenId: string): Promise<{
        Joven: {
            id: string;
            unidadId: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nombres: string;
            apellidos: string;
            fechaNacimiento: Date;
            representanteId: string;
            estado: string;
            historial: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        alergias: string | null;
        medicamentos: string | null;
        condiciones: string | null;
        seguro: string | null;
        contactoEmergencia: string | null;
        jovenId: string;
    }>;
    findOne(id: string): Promise<{
        Joven: {
            id: string;
            unidadId: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nombres: string;
            apellidos: string;
            fechaNacimiento: Date;
            representanteId: string;
            estado: string;
            historial: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        alergias: string | null;
        medicamentos: string | null;
        condiciones: string | null;
        seguro: string | null;
        contactoEmergencia: string | null;
        jovenId: string;
    }>;
    update(id: string, dto: UpdateFichaMedicaDto, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        alergias: string | null;
        medicamentos: string | null;
        condiciones: string | null;
        seguro: string | null;
        contactoEmergencia: string | null;
        jovenId: string;
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        alergias: string | null;
        medicamentos: string | null;
        condiciones: string | null;
        seguro: string | null;
        contactoEmergencia: string | null;
        jovenId: string;
    }>;
}
