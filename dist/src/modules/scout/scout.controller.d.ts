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
            fechaInicio: Date;
            etapa: string;
            fechaCulminacion: Date | null;
            jovenId: string;
        };
    }>;
    findAllProgresiones(): Promise<{
        success: boolean;
        message: string;
        data: ({
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
        })[];
    }>;
    findProgresion(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
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
            fechaInicio: Date;
            etapa: string;
            fechaCulminacion: Date | null;
            jovenId: string;
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
            tipo: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nombre: string;
            descripcion: string | null;
        };
    }>;
    findAllCondecoraciones(): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            tipo: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            nombre: string;
            descripcion: string | null;
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
        })[];
    }>;
    removeJovenCondecoracion(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
