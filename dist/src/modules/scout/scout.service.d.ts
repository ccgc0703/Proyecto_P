import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../../common/base.service';
export declare class ScoutService extends BaseService<any> {
    constructor(prisma: PrismaService);
    createProgresion(data: any, userId: string): Promise<{
        id: string;
        unidadId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        jovenId: string;
        etapa: string;
        fechaInicio: Date;
        fechaCulminacion: Date | null;
    }>;
    findAllProgresiones(): Promise<({
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
        unidadId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        jovenId: string;
        etapa: string;
        fechaInicio: Date;
        fechaCulminacion: Date | null;
    })[]>;
    findProgresionById(id: string): Promise<{
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
        unidadId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        jovenId: string;
        etapa: string;
        fechaInicio: Date;
        fechaCulminacion: Date | null;
    }>;
    updateProgresion(id: string, data: any, userId: string): Promise<{
        id: string;
        unidadId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        jovenId: string;
        etapa: string;
        fechaInicio: Date;
        fechaCulminacion: Date | null;
    }>;
    removeProgresion(id: string, userId: string): Promise<{
        id: string;
        unidadId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        jovenId: string;
        etapa: string;
        fechaInicio: Date;
        fechaCulminacion: Date | null;
    }>;
    createCondecoracion(data: any, userId: string): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        descripcion: string | null;
        tipo: string;
    }>;
    findAllCondecoraciones(): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        descripcion: string | null;
        tipo: string;
    }[]>;
    findCondecoracionById(id: string): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        descripcion: string | null;
        tipo: string;
    }>;
    removeCondecoracion(id: string, userId: string): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        descripcion: string | null;
        tipo: string;
    }>;
    findJovenCondecoraciones(jovenId: string): Promise<({
        Condecoracion: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            descripcion: string | null;
            tipo: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        jovenId: string;
        condecoracionId: string;
        fechaOtorgada: Date;
    })[]>;
    removeJovenCondecoracion(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        jovenId: string;
        condecoracionId: string;
        fechaOtorgada: Date;
    }>;
    otorgarCondecoracion(jovenId: string, condecoracionId: string, userId: string): Promise<any>;
}
