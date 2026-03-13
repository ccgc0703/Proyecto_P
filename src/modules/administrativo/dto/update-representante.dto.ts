import { IsString, IsOptional } from 'class-validator';

export class UpdateRepresentanteDto {
    @IsOptional()
    @IsString()
    nombre?: string;

    @IsOptional()
    @IsString()
    telefono?: string;

    @IsOptional()
    @IsString()
    direccion?: string;

    @IsOptional()
    @IsString()
    parentesco?: string;
}
