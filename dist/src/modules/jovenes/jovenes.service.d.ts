import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../../common/base.service';
import { CreateJovenDto } from './dto/create-joven.dto';
import { UpdateJovenDto } from './dto/update-joven.dto';
import { AuditService } from '../audit/audit.service';
export declare class JovenesService extends BaseService<any> {
    private readonly auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    private validateUnitAccess;
    findAllByUnit(unidadId: string): Promise<({
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
        Representante: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
            cedula: string;
            telefono: string | null;
            direccion: string | null;
            parentesco: string | null;
        };
    } & {
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
    })[]>;
    createJoven(createJovenDto: CreateJovenDto, userId: string, userRol: string, userUnidadId?: string): Promise<any>;
    updateJoven(id: string, dto: UpdateJovenDto, actorId: string): Promise<{
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
    }>;
    removeJoven(id: string, actorId: string): Promise<any>;
}
