import { CategoriaNormativa } from '@prisma/client';
import {
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    MinLength,
} from 'class-validator';

/** Metadata del documento que acompaña al multipart (campo `file`). */
export class CreateDocumentoDto {
    @IsString({ message: 'El titulo es requerido' })
    @MinLength(3, { message: 'El titulo debe tener al menos 3 caracteres' })
    @MaxLength(200, { message: 'El titulo no puede exceder 200 caracteres' })
    titulo: string;

    @IsEnum(CategoriaNormativa, {
        message: 'categoria debe ser LEY_PROMESA, REGLAMENTO, ACTA, CIRCULAR u OTRO',
    })
    categoria: CategoriaNormativa;

    @IsOptional()
    @IsString({ message: 'La descripcion debe ser texto' })
    @MaxLength(1000, { message: 'La descripcion no puede exceder 1000 caracteres' })
    descripcion?: string;

    /** null/omitido = documento nacional (visible para todas las unidades). */
    @IsOptional()
    @IsUUID(undefined, { message: 'unidadId debe ser un UUID valido' })
    unidadId?: string;
}
