import { JovenesService } from './jovenes.service';
import { CreateJovenDto } from './dto/create-joven.dto';
import { UpdateJovenDto } from './dto/update-joven.dto';
import { UnitPolicy } from '../../common/policies/unit.policy';
export declare class JovenesController {
    private readonly jovenesService;
    private readonly unitPolicy;
    constructor(jovenesService: JovenesService, unitPolicy: UnitPolicy);
    getStats(): Promise<{
        success: boolean;
        data: {
            totalJovenes: number;
            manada: number;
            tropa: number;
            clan: number;
        };
    }>;
    create(createJovenDto: CreateJovenDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            miembroId: string;
            representanteId: string;
            historial: string | null;
            Joven: {
                id: string;
                miembroId: string;
                representanteId: string;
                historial: string | null;
            };
            nombres: string;
            apellidos: string;
            cedula: string;
            fechaNacimiento: Date;
            genero: import(".prisma/client").$Enums.Genero;
            tipo: import(".prisma/client").$Enums.TipoMiembro;
            estado: import(".prisma/client").$Enums.EstadoMiembro;
            unidadId: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
        };
    }>;
    findAll(req: any, queryUnidadId?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            Representante: {
                id: string;
                cedula: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                createdBy: string | null;
                updatedBy: string | null;
                nombre: string;
                telefono: string | null;
                direccion: string | null;
                parentesco: string | null;
            };
            miembroId: string;
            representanteId: string;
            historial: string | null;
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
            FichaMedica: {
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
            nombres: string;
            apellidos: string;
            cedula: string;
            fechaNacimiento: Date;
            genero: import(".prisma/client").$Enums.Genero;
            tipo: import(".prisma/client").$Enums.TipoMiembro;
            estado: import(".prisma/client").$Enums.EstadoMiembro;
            unidadId: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
        }[];
    }>;
    findOne(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            Progresiones: {
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
            }[];
            Representante: {
                id: string;
                cedula: string;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                createdBy: string | null;
                updatedBy: string | null;
                nombre: string;
                telefono: string | null;
                direccion: string | null;
                parentesco: string | null;
            };
            miembroId: string;
            representanteId: string;
            historial: string | null;
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
            FichaMedica: {
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
            Condecoraciones: ({
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
            nombres: string;
            apellidos: string;
            cedula: string;
            fechaNacimiento: Date;
            genero: import(".prisma/client").$Enums.Genero;
            tipo: import(".prisma/client").$Enums.TipoMiembro;
            estado: import(".prisma/client").$Enums.EstadoMiembro;
            unidadId: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
        };
    }>;
    update(id: string, updateJovenDto: UpdateJovenDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            miembroId: string;
            representanteId: string;
            historial: string | null;
            Joven: {
                id: string;
                miembroId: string;
                representanteId: string;
                historial: string | null;
            };
            nombres: string;
            apellidos: string;
            cedula: string;
            fechaNacimiento: Date;
            genero: import(".prisma/client").$Enums.Genero;
            tipo: import(".prisma/client").$Enums.TipoMiembro;
            estado: import(".prisma/client").$Enums.EstadoMiembro;
            unidadId: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            createdBy: string | null;
            updatedBy: string | null;
        };
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
