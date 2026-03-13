import { IsString, IsOptional } from 'class-validator';

export class CreateUnidadDto {
    @IsString({ message: 'El nombre es requerido' })
    nombre: string;

    @IsOptional()
    @IsString()
    tipo?: string;

    @IsOptional()
    @IsString()
    descripcion?: string;
}
