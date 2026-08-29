import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoSangre } from '@prisma/client';
import { UpdateAlergiaDto, UpdateMedicamentoDto, UpdateCondicionDto, UpdateVacunaDto } from './update-ficha-subdto.dto';

export class UpdateFichaMedicaDto {
    @IsOptional()
    @IsEnum(TipoSangre)
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

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateAlergiaDto)
    alergiasDetalle?: UpdateAlergiaDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateMedicamentoDto)
    medicamentosDetalle?: UpdateMedicamentoDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateCondicionDto)
    condicionesDetalle?: UpdateCondicionDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateVacunaDto)
    vacunasDetalle?: UpdateVacunaDto[];
}
