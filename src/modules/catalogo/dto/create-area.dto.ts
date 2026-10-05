import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { RamaUnidad, TipoArea } from '@prisma/client';

export class CreateAreaDto {
    @IsString({ message: 'El nombre del area es requerido' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @MinLength(2, { message: 'El nombre del area debe tener al menos 2 caracteres' })
    @MaxLength(80, { message: 'El nombre del area no puede exceder 80 caracteres' })
    nombre: string;

    @IsOptional()
    @IsEnum(TipoArea, { message: 'El tipo debe ser AREA_CRECIMIENTO o PRUEBA_ADELANTO' })
    tipo?: TipoArea;

    @IsInt({ message: 'El orden debe ser un numero entero' })
    @Min(1, { message: 'El orden minimo es 1' })
    @Max(99, { message: 'El orden maximo es 99' })
    orden: number;

    @IsOptional()
    @IsBoolean({ message: 'El campo activo debe ser booleano' })
    activo?: boolean;

    @IsOptional()
    @IsEnum(RamaUnidad, { message: 'rama debe ser MANADA, TROPA, COMUNIDAD o CLAN (omitir para todas)' })
    rama?: RamaUnidad;
}
