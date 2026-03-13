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
}
