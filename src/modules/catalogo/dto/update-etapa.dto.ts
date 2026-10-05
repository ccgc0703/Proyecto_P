import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateEtapaDto {
    @IsOptional()
    @IsString({ message: 'El nombre de la etapa debe ser texto' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @MinLength(2, { message: 'El nombre de la etapa debe tener al menos 2 caracteres' })
    @MaxLength(40, { message: 'El nombre de la etapa no puede exceder 40 caracteres' })
    nombre?: string;

    @IsOptional()
    @IsBoolean({ message: 'El campo activo debe ser booleano' })
    activo?: boolean;
}
