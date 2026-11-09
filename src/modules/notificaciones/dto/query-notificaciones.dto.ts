import { IsIn, IsOptional, Matches } from 'class-validator';

/** Query params de `GET /notificaciones` (todos opcionales). */
export class QueryNotificacionesDto {
    /** `true` → devuelve solo las notificaciones no leídas. */
    @IsOptional()
    @IsIn(['true', 'false'], { message: 'soloNoLeidas debe ser true o false' })
    soloNoLeidas?: string;

    /** Página (entero ≥ 1); sin valor = 1. */
    @IsOptional()
    @Matches(/^\d+$/, { message: 'page debe ser un entero positivo' })
    page?: string;

    /** Tamaño de página (se limita a 100); sin valor = 20. */
    @IsOptional()
    @Matches(/^\d+$/, { message: 'limit debe ser un entero positivo' })
    limit?: string;
}
