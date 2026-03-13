import { FichaMedicaService } from './ficha-medica.service';
import { CreateFichaMedicaDto } from './dto/create-ficha-medica.dto';
import { UpdateFichaMedicaDto } from './dto/update-ficha-medica.dto';
export declare class FichaMedicaController {
    private readonly fichaMedicaService;
    constructor(fichaMedicaService: FichaMedicaService);
    create(dto: CreateFichaMedicaDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    findAll(): Promise<{
        success: boolean;
        message: string;
        data: ({
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
        })[];
    }>;
    findByJoven(jovenId: string): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    findOne(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    update(id: string, dto: UpdateFichaMedicaDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
