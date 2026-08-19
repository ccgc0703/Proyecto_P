import { IsString, IsDateString, IsUUID, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateJovenDto {
    @IsString({ message: 'Los nombres son requeridos' })
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    nombres: string;

    @IsString({ message: 'Los apellidos son requeridos' })
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    apellidos: string;

    @IsDateString({}, { message: 'Fecha de nacimiento inválida' })
    fechaNacimiento: string;

    @IsUUID('4', { message: 'ID de unidad inválido' })
    unidadId: string;

    @IsUUID('4', { message: 'ID de representante inválido' })
    representanteId: string;

    @IsNotEmpty({ message: 'La cédula es requerida' })
    @IsString({ message: 'La cédula debe ser un texto' })
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    cedula: string;

    @IsNotEmpty({ message: 'El género es requerido' })
    @IsEnum(['MASCULINO', 'FEMENINO'], { message: 'Género inválido (MASCULINO o FEMENINO)' })
    genero: 'MASCULINO' | 'FEMENINO';

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    estado?: string;

    @IsOptional()
    @IsString()
    historial?: string;

    @IsOptional()
    @IsDateString({}, { message: 'Fecha de ingreso inválida' })
    fechaIngreso?: string;

    @IsOptional()
    @IsDateString({}, { message: 'Fecha de promesa inválida' })
    fechaPromesa?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    cargoActual?: string;

    @IsOptional()
    @IsUUID('4', { message: 'ID de patrulla inválido' })
    patrullaId?: string;
}
