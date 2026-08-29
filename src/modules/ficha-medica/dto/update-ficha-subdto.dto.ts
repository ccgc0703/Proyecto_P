import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { Severidad } from '@prisma/client';

export class UpdateAlergiaDto {
    @IsOptional()
    @IsString()
    id?: string;

    @IsOptional()
    @IsBoolean()
    eliminar?: boolean;

    @IsOptional()
    @IsString()
    nombre?: string;

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

export class UpdateMedicamentoDto {
    @IsOptional()
    @IsString()
    id?: string;

    @IsOptional()
    @IsBoolean()
    eliminar?: boolean;

    @IsOptional()
    @IsString()
    nombre?: string;

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

export class UpdateCondicionDto {
    @IsOptional()
    @IsString()
    id?: string;

    @IsOptional()
    @IsBoolean()
    eliminar?: boolean;

    @IsOptional()
    @IsString()
    nombre?: string;

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

export class UpdateVacunaDto {
    @IsOptional()
    @IsString()
    id?: string;

    @IsOptional()
    @IsBoolean()
    eliminar?: boolean;

    @IsOptional()
    @IsString()
    nombre?: string;

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
