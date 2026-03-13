import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRepresentanteDto {
    @IsString({ message: 'El nombre es obligatorio' })
    nombre: string;

    @IsString({ message: 'La cédula es obligatoria' })
    cedula: string;

    @IsOptional()
    @IsString()
    telefono?: string;

    @IsOptional()
    @IsString()
    direccion?: string;

    @IsOptional()
    @IsString()
    parentesco?: string;
}
