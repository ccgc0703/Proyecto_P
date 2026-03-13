import { JovenesService } from './jovenes.service';
import { CreateJovenDto } from './dto/create-joven.dto';
import { UpdateJovenDto } from './dto/update-joven.dto';
import { UnitPolicy } from '../../common/policies/unit.policy';
export declare class JovenesController {
    private readonly jovenesService;
    private readonly unitPolicy;
    constructor(jovenesService: JovenesService, unitPolicy: UnitPolicy);
    create(createJovenDto: CreateJovenDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    findAll(req: any, queryUnidadId?: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    findOne(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    update(id: string, updateJovenDto: UpdateJovenDto, req: any): Promise<{
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
            nombres: string;
            apellidos: string;
            fechaNacimiento: Date;
            representanteId: string;
            estado: string;
            historial: string | null;
        };
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
