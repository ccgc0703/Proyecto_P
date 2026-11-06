import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoUnidad } from '@prisma/client';

export class CreateUnidadDto {
    @IsString({ message: 'El nombre es requerido' })
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    nombre: string;

    @IsOptional()
    @IsEnum(TipoUnidad, { message: 'tipo debe ser MANADA, TROPA, COMUNIDAD o CLAN' })
    @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().trim() : value))
    tipo?: TipoUnidad;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    descripcion?: string;
}
