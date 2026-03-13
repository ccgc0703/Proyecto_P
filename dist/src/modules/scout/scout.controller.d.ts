import { ScoutService } from './scout.service';
export declare class ScoutController {
    private readonly scoutService;
    constructor(scoutService: ScoutService);
    createProgresion(data: any, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    findAllProgresiones(): Promise<{
        success: boolean;
        message: string;
        data: ({
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
        })[];
    }>;
    findProgresion(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    updateProgresion(id: string, data: any, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    removeProgresion(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    createCondecoracion(data: any, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
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
    }>;
    findAllCondecoraciones(): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            descripcion: string | null;
            tipo: string;
        }[];
    }>;
    removeCondecoracion(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    otorgarCondecoracion(data: {
        jovenId: string;
        condecoracionId: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    findJovenCondecoraciones(jovenId: string): Promise<{
        success: boolean;
        message: string;
        data: ({
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
        })[];
    }>;
    removeJovenCondecoracion(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
