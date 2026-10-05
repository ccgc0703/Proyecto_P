import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Alta de condecoración en el catálogo (no confundir con otorgar a un miembro).
 * El service persiste únicamente estos campos (los auditoría los añade él).
 */
export class CreateCondecoracionDto {
    @IsString({ message: 'El nombre de la condecoración es requerido' })
    @IsNotEmpty({ message: 'El nombre de la condecoración no puede estar vacío' })
    nombre: string;

    @IsString({ message: 'El tipo de la condecoración es requerido' })
    @IsNotEmpty({ message: 'El tipo de la condecoración no puede estar vacío' })
    tipo: string;

    @IsOptional()
    @IsString()
    descripcion?: string;
}
