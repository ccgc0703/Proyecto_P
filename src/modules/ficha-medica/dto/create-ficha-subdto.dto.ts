import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { Severidad } from '@prisma/client';

export class CreateAlergiaDto {
    @IsString()
    nombre: string;

    @IsOptional()
    @IsEnum(Severidad)
    severidad?: Severidad;

    @IsOptional()
    @IsString()
    reaccion?: string;

    @IsOptional()
    @IsString()
    observaciones?: string;
}

export class CreateMedicamentoDto {
    @IsString()
    nombre: string;

    @IsOptional()
    @IsString()
    dosis?: string;

    @IsOptional()
    @IsString()
    frecuencia?: string;

    @IsOptional()
    @IsString()
    motivo?: string;

    @IsOptional()
    @IsString()
    prescritoPor?: string;
}

export class CreateCondicionDto {
    @IsString()
    nombre: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsDateString()
    fechaDiagnostico?: string;

    @IsOptional()
    @IsBoolean()
    requiereControl?: boolean;
}

export class CreateVacunaDto {
    @IsString()
    nombre: string;

    @IsOptional()
    @IsDateString()
    fechaAplicacion?: string;

    @IsOptional()
    @IsString()
    lote?: string;

    @IsOptional()
    @IsString()
    observaciones?: string;
}
