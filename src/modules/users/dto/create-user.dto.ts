import { IsEmail, IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ROLES } from '../../../common/constantes';

export class CreateUserDto {
    @IsString({ message: 'El nombre es requerido' })
    nombre: string;

    @IsEmail({}, { message: 'Formato de email inválido' })
    email: string;

    @IsString({ message: 'La contraseña es requerida' })
    password: string;


    @IsOptional()
    @IsString()
    unidadId?: string;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
