import { IsString, IsOptional } from 'class-validator';

export class UpdateFichaMedicaDto {
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
    seguro?: string;

    @IsOptional()
    @IsString()
    contactoEmergencia?: string;
}
