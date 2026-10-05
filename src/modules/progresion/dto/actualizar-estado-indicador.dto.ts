import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoLogro } from '@prisma/client';

export class ActualizarEstadoIndicadorDto {
    @IsEnum(EstadoLogro, {
        message: 'El estado debe ser PENDIENTE, EN_PROCESO, PENDIENTE_APROBACION o COMPLETADO',
    })
    estado: EstadoLogro;

    @IsOptional()
    @IsString({ message: 'Las observaciones deben ser texto' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @MaxLength(500, { message: 'Las observaciones no pueden exceder 500 caracteres' })
    observaciones?: string;
}
