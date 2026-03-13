import { IsString, IsDateString, IsUUID, IsOptional, IsEnum } from 'class-validator';

export class CreateJovenDto {
    @IsString({ message: 'Los nombres son requeridos' })
    nombres: string;

    @IsString({ message: 'Los apellidos son requeridos' })
    apellidos: string;

    @IsDateString({}, { message: 'Fecha de nacimiento inválida' })
    fechaNacimiento: string;

    @IsUUID('4', { message: 'ID de unidad inválido' })
    unidadId: string;

    @IsUUID('4', { message: 'ID de representante inválido' })
    representanteId: string;

    @IsOptional()
    @IsString()
    estado?: string;

    @IsOptional()
    @IsString()
    historial?: string;
}
