import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { EstadoPlanificacion } from '@prisma/client';

export class CreatePlanificacionDto {
    @IsString({ message: 'El titulo es requerido' })
    @MinLength(3, { message: 'El titulo debe tener al menos 3 caracteres' })
    @MaxLength(120, { message: 'El titulo no puede exceder 120 caracteres' })
    titulo: string;

    @IsOptional()
    @IsString({ message: 'La descripcion debe ser texto' })
    @MaxLength(500, { message: 'La descripcion no puede exceder 500 caracteres' })
    descripcion?: string;

    @IsISO8601({}, { message: 'fechaInicio debe ser una fecha valida (ISO 8601)' })
    fechaInicio: string;

    @IsISO8601({}, { message: 'fechaFin debe ser una fecha valida (ISO 8601)' })
    fechaFin: string;

    @IsOptional()
    @IsUUID(undefined, { message: 'unidadId debe ser un UUID valido (omitir para ambito grupo)' })
    unidadId?: string;

    @IsOptional()
    @IsEnum(EstadoPlanificacion, {
        message: 'estado debe ser BORRADOR, APROBADO, EN_CURSO, COMPLETADO o CANCELADO',
    })
    estado?: EstadoPlanificacion;
}
