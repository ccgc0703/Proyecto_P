import { IsOptional, IsString, IsEmail, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
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

    @IsOptional()
    @IsString()
    unidadId?: string;

    /** F4.3: ámbito jerárquico. null limpia el ámbito (visión global). */
    @IsOptional()
    @IsUUID('4', { message: 'nodoId debe ser un UUID válido o null' })
    nodoId?: string | null;
}
