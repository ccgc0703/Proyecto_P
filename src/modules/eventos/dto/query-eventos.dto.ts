import { IsEnum, IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { EstadoActividad, EstadoPlanificacion, TipoActividad } from '@prisma/client';

export class QueryPlanificacionesDto {
    @IsOptional()
    @IsUUID(undefined, { message: 'unidadId debe ser un UUID valido' })
    unidadId?: string;

    @IsOptional()
    @IsEnum(EstadoPlanificacion, {
        message: 'estado debe ser BORRADOR, APROBADO, EN_CURSO, COMPLETADO o CANCELADO',
    })
    estado?: EstadoPlanificacion;
}

export class QueryActividadesDto {
    @IsOptional()
    @IsUUID(undefined, { message: 'planificacionId debe ser un UUID valido' })
    planificacionId?: string;

    @IsOptional()
    @IsUUID(undefined, { message: 'unidadId debe ser un UUID valido' })
    unidadId?: string;

    @IsOptional()
    @IsEnum(TipoActividad, {
        message: 'tipo debe ser REUNION, CAMPAMENTO, EXCURSION, SERVICIO_COMUNITARIO, TALLER, CEREMONIA, COMPETENCIA u OTRO',
    })
    tipo?: TipoActividad;

    @IsOptional()
    @IsEnum(EstadoActividad, { message: 'estado debe ser PENDIENTE, EN_CURSO, COMPLETADA o CANCELADA' })
    estado?: EstadoActividad;

    @IsOptional()
    @IsISO8601({}, { message: 'desde debe ser una fecha valida (ISO 8601)' })
    desde?: string;

    @IsOptional()
    @IsISO8601({}, { message: 'hasta debe ser una fecha valida (ISO 8601)' })
    hasta?: string;
}

export class QueryAsistenciasUnidadDto {
    @IsOptional()
    @IsISO8601({}, { message: 'desde debe ser una fecha valida (ISO 8601)' })
    desde?: string;

    @IsOptional()
    @IsISO8601({}, { message: 'hasta debe ser una fecha valida (ISO 8601)' })
    hasta?: string;
}
