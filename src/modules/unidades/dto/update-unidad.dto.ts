import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUnidadDto {
  @IsOptional()
  @IsString({ message: 'El nombre es opcional' })
  @Transform(({ value }) => value?.toUpperCase()?.trim())
  nombre?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}