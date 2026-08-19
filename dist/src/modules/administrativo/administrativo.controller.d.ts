import { AdministrativoService } from './administrativo.service';
import { CreateRepresentanteDto } from './dto/create-representante.dto';
import { UpdateRepresentanteDto } from './dto/update-representante.dto';
export declare class AdministrativoController {
    private readonly administrativoService;
    constructor(administrativoService: AdministrativoService);
    createRepresentante(dto: CreateRepresentanteDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    findAllRepresentantes(): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    findOneRepresentante(id: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    updateRepresentante(id: string, dto: UpdateRepresentanteDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    removeRepresentante(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    createFichaMedica(data: any, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
}
