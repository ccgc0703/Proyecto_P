import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRepresentanteDto {
    @IsString({ message: 'El nombre es obligatorio' })
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    nombre: string;

    @IsString({ message: 'La cédula es obligatoria' })
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    cedula: string;

    @IsOptional()
    @IsString()
    telefono?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    direccion?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    parentesco?: string;
}
