import { IsUUID } from 'class-validator';

/**
 * Otorga una condecoración del catálogo a un miembro (joven).
 * Los ids deben existir: el service los valida antes de insertar.
 */
export class OtorgarCondecoracionDto {
    @IsUUID(undefined, { message: 'El id del joven debe ser un UUID válido' })
    jovenId: string;

    @IsUUID(undefined, { message: 'El id de la condecoración debe ser un UUID válido' })
    condecoracionId: string;
}
