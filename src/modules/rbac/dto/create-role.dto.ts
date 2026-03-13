import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateRoleDto {
    @IsString()
    @IsNotEmpty({ message: 'El nombre del rol es requerido' })
    @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
    @MaxLength(50, { message: 'El nombre no puede superar 50 caracteres' })
    @Matches(/^[A-Z0-9_]+$/i, {
        message: 'El nombre solo puede contener letras, números y guiones bajos (ej: CONSULTOR, GROUP_LEADER)',
    })
    nombre: string;

    @IsString()
    @IsNotEmpty({ message: 'La descripción es requerida' })
    @MaxLength(200, { message: 'La descripción no puede superar 200 caracteres' })
    descripcion: string;
}
