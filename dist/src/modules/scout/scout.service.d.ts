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
        fechaInicio: Date;
        etapa: string;
        fechaCulminacion: Date | null;
        jovenId: string;
    }>;
    findAllProgresiones(): Promise<({
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
        Joven: {
            id: string;
            miembroId: string;
            representanteId: string;
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
        fechaInicio: Date;
        etapa: string;
        fechaCulminacion: Date | null;
        jovenId: string;
    })[]>;
    findProgresionById(id: string): Promise<{
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
        Joven: {
            id: string;
            miembroId: string;
            representanteId: string;
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
        fechaInicio: Date;
        etapa: string;
        fechaCulminacion: Date | null;
        jovenId: string;
    }>;
    updateProgresion(id: string, data: any, userId: string): Promise<{
        id: string;
        unidadId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        fechaInicio: Date;
        etapa: string;
        fechaCulminacion: Date | null;
        jovenId: string;
    }>;
    removeProgresion(id: string, userId: string): Promise<{
        id: string;
        unidadId: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        fechaInicio: Date;
        etapa: string;
        fechaCulminacion: Date | null;
        jovenId: string;
    }>;
    createCondecoracion(data: any, userId: string): Promise<{
        id: string;
        tipo: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nombre: string;
        descripcion: string | null;
    }>;
    findAllCondecoraciones(): Promise<{
        id: string;
        tipo: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nombre: string;
        descripcion: string | null;
    }[]>;
    findCondecoracionById(id: string): Promise<{
        id: string;
        tipo: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nombre: string;
        descripcion: string | null;
    }>;
    removeCondecoracion(id: string, userId: string): Promise<{
        id: string;
        tipo: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        nombre: string;
        descripcion: string | null;
    }>;
    findJovenCondecoraciones(miembroId: string): Promise<({
        Condecoracion: {
            id: string;
            tipo: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nombre: string;
            descripcion: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        createdBy: string | null;
        updatedBy: string | null;
        miembroId: string;
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
        miembroId: string;
        condecoracionId: string;
        fechaOtorgada: Date;
    }>;
    otorgarCondecoracion(miembroId: string, condecoracionId: string, userId: string): Promise<any>;
}
