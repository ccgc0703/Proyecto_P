import { CategoriaNormativa } from '@prisma/client';
import {
    IsEnum,
    IsIn,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    MaxLength,
} from 'class-validator';

/** Query params de `GET /normativa/documentos` (todos opcionales). */
export class QueryDocumentosDto {
    @IsOptional()
    @IsEnum(CategoriaNormativa, {
        message: 'categoria debe ser LEY_PROMESA, REGLAMENTO, ACTA, CIRCULAR u OTRO',
    })
    categoria?: CategoriaNormativa;

    /** `true` = solo vigentes; `false` = solo históricos. Omitido = todos. */
    @IsOptional()
    @IsIn(['true', 'false'], { message: 'vigente debe ser true o false' })
    vigente?: string;

    @IsOptional()
    @IsUUID(undefined, { message: 'unidadId debe ser un UUID valido' })
    unidadId?: string;

    @IsOptional()
    @IsString({ message: 'q debe ser texto' })
    @MaxLength(100, { message: 'q no puede exceder 100 caracteres' })
    q?: string;

    @IsOptional()
    @Matches(/^\d+$/, { message: 'page debe ser un entero positivo' })
    page?: string;

    @IsOptional()
    @Matches(/^\d+$/, { message: 'limit debe ser un entero positivo' })
    limit?: string;
}
