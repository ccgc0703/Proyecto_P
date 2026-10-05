import { IsOptional, IsString, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Campos que cualquier usuario autenticado puede editar de su propia
 * cuenta (endpoint PATCH /users/me). No incluye unidadId ni roles.
 */
export class UpdateMeDto {
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    nombre?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    apellido?: string;

    @IsOptional()
    @IsEmail()
    email?: string;
}
