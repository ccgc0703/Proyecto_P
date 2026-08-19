import { IsString, IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateAdultoDto {
    @IsOptional() @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    nombres?: string;

    @IsOptional() @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    apellidos?: string;

    @IsOptional() @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    cedula?: string;

    @IsOptional() @IsDateString()
    fechaNacimiento?: string;

    @IsOptional() @IsEnum(['MASCULINO', 'FEMENINO'])
    genero?: 'MASCULINO' | 'FEMENINO';

    @IsOptional() @IsUUID()
    unidadId?: string;

    @IsOptional() @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    ocupacion?: string;

    @IsOptional() @IsString()
    telefono?: string;

    @IsOptional() @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    direccion?: string;
}
