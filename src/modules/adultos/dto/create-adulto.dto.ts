import { IsString, IsOptional, IsDateString, IsEnum, IsEmail, MinLength, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAdultoDto {
    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    nombres: string;

    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    apellidos: string;

    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    cedula: string;

    @IsDateString()
    fechaNacimiento: string;

    @IsEnum(['MASCULINO', 'FEMENINO'])
    genero: 'MASCULINO' | 'FEMENINO';

    @IsUUID()
    unidadId: string;

    @IsOptional() @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    ocupacion?: string;

    @IsOptional() @IsString()
    telefono?: string;

    @IsOptional() @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    direccion?: string;

    // Campos opcionales para crear cuenta de usuario de una vez
    @IsOptional() @IsEmail()
    email?: string;

    @IsOptional() @IsString() @MinLength(6)
    password?: string;

    @IsOptional() @IsString()
    rolId?: string;
}
