import { IsString, IsUUID, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePatrullaDto {
    @IsString({ message: 'El nombre es requerido' })
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    nombre: string;

    @IsOptional()
    @IsUUID('4', { message: 'ID de unidad inválido' })
    unidadId?: string;

    @IsOptional()
    @IsString()
    color?: string;
}
