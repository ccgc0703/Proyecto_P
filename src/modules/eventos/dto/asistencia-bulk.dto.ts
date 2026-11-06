import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { EstadoAsistencia } from '@prisma/client';

export class MarcaAsistenciaDto {
    @IsUUID(undefined, { message: 'miembroId debe ser un UUID valido' })
    miembroId: string;

    @IsEnum(EstadoAsistencia, { message: 'estado debe ser PRESENTE, AUSENTE o JUSTIFICADO' })
    estado: EstadoAsistencia;

    @IsOptional()
    @IsString({ message: 'La observacion debe ser texto' })
    @MaxLength(240, { message: 'La observacion no puede exceder 240 caracteres' })
    observacion?: string;
}

/**
 * Marcado masivo: se envia la planilla completa de la actividad de una vez
 * (solo filas cambiadas o todas; el backend hace upsert por
 * (actividadId, miembroId)).
 */
export class AsistenciaBulkDto {
    @IsArray({ message: 'registros debe ser un arreglo' })
    @ArrayMinSize(1, { message: 'registros debe tener al menos 1 elemento' })
    @ArrayMaxSize(500, { message: 'registros no puede exceder 500 elementos' })
    @ValidateNested({ each: true })
    @Type(() => MarcaAsistenciaDto)
    registros: MarcaAsistenciaDto[];
}
