import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateJovenDto {
    @IsOptional()
    @IsString()
    nombres?: string;

    @IsOptional()
    @IsString()
    apellidos?: string;

    @IsOptional()
    @IsDateString()
    fechaNacimiento?: string;

    @IsOptional()
    @IsString()
    unidadId?: string;
}
