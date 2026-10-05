import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class UpdateCargoDto {
    @IsOptional()
    @IsDateString()
    hasta?: string;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
