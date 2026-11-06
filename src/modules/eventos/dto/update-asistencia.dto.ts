import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EstadoAsistencia } from '@prisma/client';

export class UpdateAsistenciaDto {
    @IsOptional()
    @IsEnum(EstadoAsistencia, { message: 'estado debe ser PRESENTE, AUSENTE o JUSTIFICADO' })
    estado?: EstadoAsistencia;

    @IsOptional()
    @IsString({ message: 'La observacion debe ser texto' })
    @MaxLength(240, { message: 'La observacion no puede exceder 240 caracteres' })
    observacion?: string;
}
