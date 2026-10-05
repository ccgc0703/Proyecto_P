import { IsEmail, IsString, IsOptional, IsBoolean, IsEnum, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ROLES } from '../../../common/constantes';

export class CreateUserDto {
    @IsString({ message: 'El nombre es requerido' })
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    nombre: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    apellido?: string;

    @IsEmail({}, { message: 'Formato de email inválido' })
    email: string;

    @IsString({ message: 'La contraseña es requerida' })
    password: string;


    @IsOptional()
    @IsString()
    unidadId?: string;

    /** F4.3: ámbito jerárquico del usuario (nodo CONSEJO/DIRECCIÓN/REGIÓN/DISTRITO/GRUPO). */
    @IsOptional()
    @IsUUID('4', { message: 'nodoId debe ser un UUID válido' })
    nodoId?: string;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
