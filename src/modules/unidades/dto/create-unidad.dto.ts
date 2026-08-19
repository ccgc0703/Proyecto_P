import { IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUnidadDto {
    @IsString({ message: 'El nombre es requerido' })
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    nombre: string;

    @IsOptional()
    @IsString()
    tipo?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    descripcion?: string;
}
