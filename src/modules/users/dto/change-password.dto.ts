import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Cambio de contraseña de la cuenta propia (o de otra por SYSTEM_ADMIN,
 * quien valida la propiedad en el controller).
 * La política mínima replica la del formulario del frontend (>= 6).
 */
export class ChangePasswordDto {
    @IsString({ message: 'La contraseña actual es requerida' })
    @IsNotEmpty({ message: 'La contraseña actual no puede estar vacía' })
    currentPassword: string;

    @IsString({ message: 'La nueva contraseña es requerida' })
    @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
    newPassword: string;
}
