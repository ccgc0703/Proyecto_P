import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class AssignRoleDto {
    @IsString({ message: 'rolId debe ser un string' })
    @IsNotEmpty({ message: 'rolId es requerido' })
    @IsUUID('4', { message: 'rolId debe ser un UUID válido' })
    rolId: string;
}

export class AssignRoleByNameDto {
    @IsString({ message: 'usuarioId debe ser un string' })
    @IsNotEmpty({ message: 'usuarioId es requerido' })
    @IsUUID('4', { message: 'usuarioId debe ser un UUID válido' })
    usuarioId: string;

    @IsString({ message: 'rolNombre debe ser un string' })
    @IsNotEmpty({ message: 'rolNombre es requerido' })
    rolNombre: string;
}
