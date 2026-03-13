import { UnidadesService } from './unidades.service';
import { CreateUnidadDto } from './dto/create-unidad.dto';
export declare class UnidadesController {
    private readonly unidadesService;
    constructor(unidadesService: UnidadesService);
    create(createUnidadDto: CreateUnidadDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    findAll(): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    findOne(id: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
