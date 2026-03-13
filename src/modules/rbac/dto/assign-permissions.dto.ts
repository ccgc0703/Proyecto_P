import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

export class AssignPermissionsDto {
    @IsArray({ message: 'permisos debe ser un arreglo' })
    @ArrayNotEmpty({ message: 'Debe proporcionar al menos un permiso' })
    @IsUUID('4', { each: true, message: 'Cada permiso debe ser un UUID válido' })
    permisos: string[]; // Array de IDs (UUID) de permisos
}
