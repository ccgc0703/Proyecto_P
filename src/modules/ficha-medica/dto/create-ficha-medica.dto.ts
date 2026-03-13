import { IsString, IsOptional } from 'class-validator';

export class CreateFichaMedicaDto {
    @IsString()
    jovenId: string;

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
