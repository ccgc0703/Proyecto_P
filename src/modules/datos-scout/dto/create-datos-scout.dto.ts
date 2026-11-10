import {
    IsISO8601,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

/** Expediente scout de un miembro (relación 1:1 con `Miembro`). */
export class CreateDatosScoutDto {
    @IsUUID(undefined, { message: 'miembroId debe ser un UUID valido' })
    miembroId: string;

    @IsOptional()
    @IsISO8601({}, { message: 'fechaRegistro debe ser una fecha valida (ISO 8601)' })
    fechaRegistro?: string;

    @IsOptional()
    @IsISO8601({}, { message: 'fechaIngreso debe ser una fecha valida (ISO 8601)' })
    fechaIngreso?: string;

    @IsOptional()
    @IsISO8601({}, { message: 'fechaPromesa debe ser una fecha valida (ISO 8601)' })
    fechaPromesa?: string;

    @IsOptional()
    @IsString({ message: 'cargoActual debe ser texto' })
    @MaxLength(80, { message: 'cargoActual no puede exceder 80 caracteres' })
    cargoActual?: string;

    @IsOptional()
    @IsString({ message: 'observaciones debe ser texto' })
    @MaxLength(1000, { message: 'observaciones no puede exceder 1000 caracteres' })
    observaciones?: string;

    @IsOptional()
    @IsUUID(undefined, { message: 'patrullaId debe ser un UUID valido' })
    patrullaId?: string;
}
