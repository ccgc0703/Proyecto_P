import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoUnidad } from '@prisma/client';

export class UpdateUnidadDto {
  @IsOptional()
  @IsString({ message: 'El nombre es opcional' })
  @Transform(({ value }) => value?.toUpperCase()?.trim())
  nombre?: string;

  @IsOptional()
  @IsEnum(TipoUnidad, { message: 'tipo debe ser MANADA, TROPA, COMUNIDAD o CLAN' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().trim() : value))
  tipo?: TipoUnidad;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
