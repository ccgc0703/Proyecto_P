import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { TipoUnidad } from '@prisma/client';

export class QueryEtapasDto {
    @IsOptional()
    @IsUUID(undefined, { message: 'unidadId debe ser un UUID valido' })
    unidadId?: string;

    @IsOptional()
    @IsEnum(TipoUnidad, { message: 'unidad debe ser MANADA, TROPA, COMUNIDAD o CLAN' })
    unidad?: TipoUnidad;
}

export class QueryIndicadoresDto {
    @IsOptional()
    @IsUUID(undefined, { message: 'etapaId debe ser un UUID valido' })
    etapaId?: string;

    @IsOptional()
    @IsUUID(undefined, { message: 'areaId debe ser un UUID valido' })
    areaId?: string;

    @IsOptional()
    @IsUUID(undefined, { message: 'unidadId debe ser un UUID valido' })
    unidadId?: string;

    @IsOptional()
    @IsEnum(TipoUnidad, { message: 'unidad debe ser MANADA, TROPA, COMUNIDAD o CLAN' })
    unidad?: TipoUnidad;

    @IsOptional()
    @IsString({ message: 'search debe ser texto' })
    @MaxLength(200, { message: 'search no puede exceder 200 caracteres' })
    search?: string;
}

export class QueryAdelantosDto {
    @IsOptional()
    @IsUUID(undefined, { message: 'unidadId debe ser un UUID valido' })
    unidadId?: string;

    @IsOptional()
    @IsEnum(TipoUnidad, { message: 'unidad debe ser MANADA, TROPA, COMUNIDAD o CLAN' })
    unidad?: TipoUnidad;
}
