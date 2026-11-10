import { IsISO8601, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Registro de formación (curso/certificación) de un adulto responsable. */
export class CreateFormacionDto {
    @IsString({ message: 'El nombre es requerido' })
    @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
    @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
    nombre: string;

    @IsISO8601({}, { message: 'fecha debe ser una fecha valida (ISO 8601)' })
    fecha: string;

    @IsString({ message: 'El director es requerido' })
    @MinLength(3, { message: 'El director debe tener al menos 3 caracteres' })
    @MaxLength(150, { message: 'El director no puede exceder 150 caracteres' })
    director: string;

    @IsUUID(undefined, { message: 'adultoId debe ser un UUID valido' })
    adultoId: string;
}
