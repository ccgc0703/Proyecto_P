import {
    IsEnum,
    IsISO8601,
    IsOptional,
    IsUUID,
} from 'class-validator';
import { EstadoProgramaMundial } from '@prisma/client';

/** Enlace de un programa mundial (WHC, Jamboree…) con un miembro. */
export class CreateProgramaMiembroDto {
    @IsUUID(undefined, { message: 'miembroId debe ser un UUID valido' })
    miembroId: string;

    @IsUUID(undefined, { message: 'programaMundialId debe ser un UUID valido' })
    programaMundialId: string;

    @IsISO8601({}, { message: 'fechaInicio debe ser una fecha valida (ISO 8601)' })
    fechaInicio: string;

    @IsOptional()
    @IsISO8601({}, { message: 'fechaCompletado debe ser una fecha valida (ISO 8601)' })
    fechaCompletado?: string | null;

    @IsOptional()
    @IsEnum(EstadoProgramaMundial, {
        message: 'estado debe ser PENDIENTE, EN_CURSO o COMPLETADO',
    })
    estado?: EstadoProgramaMundial;
}
