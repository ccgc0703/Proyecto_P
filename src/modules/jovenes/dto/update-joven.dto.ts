import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateJovenDto {
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    nombres?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    apellidos?: string;

    @IsOptional()
    @IsDateString()
    fechaNacimiento?: string;

    @IsOptional()
    @IsString()
    unidadId?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    cedula?: string;

    @IsOptional()
    @IsEnum(['MASCULINO', 'FEMENINO'], { message: 'Género inválido (MASCULINO o FEMENINO)' })
    genero?: 'MASCULINO' | 'FEMENINO';

    @IsOptional()
    @IsString()
    representanteId?: string;

    @IsOptional()
    @IsString()
    historial?: string;

    @IsOptional()
    @IsDateString()
    fechaIngreso?: string;

    @IsOptional()
    @IsDateString()
    fechaPromesa?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    cargoActual?: string;

    @IsOptional()
    @IsString()
    patrullaId?: string;
}
