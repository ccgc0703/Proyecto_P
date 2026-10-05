import {
    IsBoolean,
    IsDateString,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { TipoSangre } from '@prisma/client';

/**
 * Alta de ficha médica desde el alta de miembro (POST /administrativo/ficha-medica).
 *
 * A diferencia del módulo ficha-medica, este endpoint persiste solo campos
 * escalares: el detalle (alergias/vacunas/etc.) vive en el módulo ficha-medica.
 */
export class CreateFichaMedicaDto {
    @IsUUID(undefined, { message: 'El id del miembro debe ser un UUID válido' })
    miembroId: string;

    @IsOptional()
    @IsEnum(TipoSangre, { message: 'Tipo de sangre inválido' })
    tipoSangre?: TipoSangre;

    @IsOptional()
    @IsString()
    telefono?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    medicoTratante?: string;

    @IsOptional()
    @IsString()
    telefonoMedico?: string;

    @IsOptional()
    @IsString()
    seguroCompania?: string;

    @IsOptional()
    @IsString()
    seguroPoliza?: string;

    @IsOptional()
    @IsDateString()
    seguroVigencia?: string;

    @IsOptional()
    @IsString()
    contactoEmergenciaNombre?: string;

    @IsOptional()
    @IsString()
    contactoEmergenciaTelefono?: string;

    @IsOptional()
    @IsString()
    contactoEmergenciaParentesco?: string;

    @IsOptional()
    @IsString()
    alergias?: string;

    @IsOptional()
    @IsString()
    medicamentos?: string;

    @IsOptional()
    @IsString()
    condiciones?: string;

    @IsOptional()
    @IsString()
    observaciones?: string;

    @IsOptional()
    @IsBoolean()
    consentimiento?: boolean;

    @IsOptional()
    @IsDateString()
    consentimientoFecha?: string;

    @IsOptional()
    @IsString()
    consentimientoObservaciones?: string;
}
