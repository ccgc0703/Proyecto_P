import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { CreateDocumentoDto } from './create-documento.dto';

/**
 * PATCH JSON (no multipart): permite corregir metadata y alternar vigencia.
 * El archivo no se reemplaza desde este endpoint.
 */
export class UpdateDocumentoDto extends PartialType(CreateDocumentoDto) {
    @IsOptional()
    @IsBoolean({ message: 'vigente debe ser booleano' })
    vigente?: boolean;

    @IsOptional()
    @IsInt({ message: 'version debe ser un entero' })
    @Min(1, { message: 'version debe ser mayor o igual a 1' })
    version?: number;
}
