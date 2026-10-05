import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { RamaUnidad } from '@prisma/client';

export class CreateIndicadorDto {
    @IsString({ message: 'El codigo es requerido' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @Matches(/^[A-Za-z0-9]{1,4}$/, {
        message: 'El codigo debe tener de 1 a 4 caracteres alfanumericos (ej. "a", "B7", "13")',
    })
    codigo: string;

    @IsString({ message: 'El texto del indicador es requerido' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @MinLength(5, { message: 'El texto del indicador debe tener al menos 5 caracteres' })
    @MaxLength(1000, { message: 'El texto del indicador no puede exceder 1000 caracteres' })
    texto: string;

    @IsUUID(undefined, { message: 'etapaId debe ser un UUID valido' })
    etapaId: string;

    @IsUUID(undefined, { message: 'areaId debe ser un UUID valido' })
    areaId: string;

    @IsEnum(RamaUnidad, { message: 'rama debe ser MANADA, TROPA, COMUNIDAD o CLAN' })
    rama: RamaUnidad;

    @IsInt({ message: 'El orden debe ser un numero entero' })
    @Min(1, { message: 'El orden minimo es 1' })
    @Max(9999, { message: 'El orden maximo es 9999' })
    orden: number;

    @IsOptional()
    @IsBoolean({ message: 'El campo activo debe ser booleano' })
    activo?: boolean;
}
