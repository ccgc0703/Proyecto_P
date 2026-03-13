import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../../common/base.service';
import { CreateRepresentanteDto } from './dto/create-representante.dto';
import { UpdateRepresentanteDto } from './dto/update-representante.dto';
export declare class AdministrativoService extends BaseService<any> {
    constructor(prisma: PrismaService);
    createRepresentante(dto: CreateRepresentanteDto, userId: string): Promise<any>;
    updateRepresentante(id: string, dto: UpdateRepresentanteDto, userId: string): Promise<any>;
    createFichaMedica(data: any, userId: string): Promise<{
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
