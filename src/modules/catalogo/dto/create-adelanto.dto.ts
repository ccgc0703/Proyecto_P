import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { RamaUnidad } from '@prisma/client';

export class CreateAdelantoDto {
    @IsString({ message: 'El nombre del adelanto es requerido' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @MinLength(3, { message: 'El nombre del adelanto debe tener al menos 3 caracteres' })
    @MaxLength(80, { message: 'El nombre del adelanto no puede exceder 80 caracteres' })
    nombre: string;

    @IsEnum(RamaUnidad, { message: 'rama debe ser MANADA, TROPA, COMUNIDAD o CLAN' })
    rama: RamaUnidad;

    @IsInt({ message: 'El orden debe ser un numero entero' })
    @Min(1, { message: 'El orden minimo es 1' })
    @Max(50, { message: 'El orden maximo es 50' })
    orden: number;

    @IsOptional()
    @IsInt({ message: 'edadMinima debe ser un numero entero' })
    @Min(0, { message: 'edadMinima minima es 0' })
    @Max(30, { message: 'edadMinima maxima es 30' })
    edadMinima?: number | null;

    @IsOptional()
    @IsInt({ message: 'umbralPorcentaje debe ser un numero entero (null = prueba aislada)' })
    @Min(1, { message: 'umbralPorcentaje minimo es 1' })
    @Max(100, { message: 'umbralPorcentaje maximo es 100' })
    umbralPorcentaje?: number | null;

    @IsOptional()
    @IsBoolean({ message: 'El campo activo debe ser booleano' })
    activo?: boolean;
}
