import { IsEnum, IsISO8601, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { EstadoActividad, TipoActividad } from '@prisma/client';

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateActividadDto {
    @IsString({ message: 'El titulo es requerido' })
    @MinLength(3, { message: 'El titulo debe tener al menos 3 caracteres' })
    @MaxLength(120, { message: 'El titulo no puede exceder 120 caracteres' })
    titulo: string;

    @IsOptional()
    @IsString({ message: 'La descripcion debe ser texto' })
    @MaxLength(500, { message: 'La descripcion no puede exceder 500 caracteres' })
    descripcion?: string;

    @IsOptional()
    @IsEnum(TipoActividad, {
        message: 'tipo debe ser REUNION, CAMPAMENTO, EXCURSION, SERVICIO_COMUNITARIO, TALLER, CEREMONIA, COMPETENCIA u OTRO',
    })
    tipo?: TipoActividad;

    @IsISO8601({}, { message: 'fecha debe ser una fecha valida (ISO 8601)' })
    fecha: string;

    @IsOptional()
    @Matches(HORA_RE, { message: 'horaInicio debe tener formato HH:MM' })
    horaInicio?: string;

    @IsOptional()
    @Matches(HORA_RE, { message: 'horaFin debe tener formato HH:MM' })
    horaFin?: string;

    @IsOptional()
    @IsString({ message: 'El lugar debe ser texto' })
    @MaxLength(120, { message: 'El lugar no puede exceder 120 caracteres' })
    lugar?: string;

    @IsOptional()
    @IsString({ message: 'El responsable debe ser texto' })
    @MaxLength(120, { message: 'El responsable no puede exceder 120 caracteres' })
    responsable?: string;

    @IsOptional()
    @IsEnum(EstadoActividad, { message: 'estado debe ser PENDIENTE, EN_CURSO, COMPLETADA o CANCELADA' })
    estado?: EstadoActividad;
}
